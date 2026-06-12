// src/fases/variables/controllers/autorizador.js
const supabase = require('../../../config/supabase');
const { enviarCorreo } = require('../../../shared/correo.services');
const { inyectarCalculosBandeja } = require('../services/calculos.services');

/**
 * EL FILTRO DE BANDEJAS: Muestra los reportes según el rol que ejerza el jefe en el momento.
 * Filtra si está actuando como supervisor o como un creador más.
 */
const obtenerBandeja = async (req, res) => {
    try {
        const { vista, periodoId, codigoUsuario } = req.params;
        
        let consulta = supabase.from('reportes_enviados')
            .select('*')
            .eq('id_periodo', periodoId)
            .neq('estado', 'Eliminado por Usuario')
            .order('id', { ascending: false });

        // Aplicamos la regla del cambio de sombrero:
        if (vista === 'AUTORIZACIONES') {
            // Sombrero de Jefe: Ve las solicitudes de su equipo (excluye lo propio y borradores)
            consulta = consulta.eq('codigo_autorizador', codigoUsuario)
                               .neq('codigo_usuario', codigoUsuario)
                               .neq('estado', 'Guardado en borrador')
                               .neq('estado', 'Borrador');
        } else {
            // Sombrero de Creador: Ve únicamente lo que él mismo digitó para su marca
            consulta = consulta.eq('codigo_usuario', codigoUsuario);
        }

        const { data, error } = await consulta;
        if (error) throw error;
        
        // Inyectamos subtotales de forma veloz usando nuestro servicio centralizado local
        const datosConCalculos = await inyectarCalculosBandeja(data || []);

        res.json({ success: true, data: datosConCalculos });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Carga el expediente detallado de un reporte (renglones, personal, firmas y excepciones)
 * para que el jefe pueda auditar antes de estampar su firma.
 */
const obtenerReporteDetalle = async (req, res) => {
    try {
        const idReporte = req.params.id;
        
        const [resRep, resLin] = await Promise.all([
            supabase.from('reportes_enviados').select('*').eq('id', idReporte).maybeSingle(),
            supabase.from('registro_variables').select('*').eq('id_reporte', idReporte)
        ]);

        if (resRep.error) throw resRep.error;
        const rep = resRep.data;
        if (!rep) throw new Error("Reporte no encontrado en el servidor.");
        
        const lineas = resLin.data || [];

        // Buscamos los colaboradores del maestro_empleados que aparecen en las líneas
        const codigosEmp = [...new Set(lineas.map(l => l.codigo_empleado).filter(Boolean))];
        let empleados = [];
        if (codigosEmp.length > 0 && rep.id_periodo) {
            const { data } = await supabase.from('maestro_empleados')
                .select('codigo_empleado, nombres_apellidos, puesto')
                .in('codigo_empleado', codigosEmp)
                .eq('id_periodo', rep.id_periodo);
            empleados = data || [];
        }

        // Buscamos las firmas registradas hasta el momento
        const usersIds = [rep.codigo_usuario, rep.codigo_autorizador, rep.codigo_contador, rep.codigo_recepcion].filter(Boolean);
        let firmantes = [];
        if (usersIds.length > 0) {
            const { data } = await supabase.from('usuarios').select('codigo, nombre').in('codigo', usersIds);
            firmantes = data || [];
        }

        const { data: perDB } = await supabase.from('periodos').select('*').eq('id', rep.id_periodo).maybeSingle();

        const { data: excepcionReporte } = await supabase
            .from('excepciones_periodo')
            .select('*')
            .eq('id_periodo', rep.id_periodo)
            .eq('codigo_empleado', rep.codigo_usuario)
            .order('id', { ascending: false })
            .limit(1)
            .maybeSingle();

        res.json({ 
            success: true, 
            reporte: rep, 
            lineas, 
            empleados, 
            firmantes, 
            periodo: perDB,
            excepcion: excepcionReporte || null 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * LA FIRMA DEL JEFE: Aprueba el reporte mandándolo a Contabilidad o lo rechaza (Denegado).
 * Responde inmediatamente a la pantalla y delega los correos al fondo del servidor.
 */
const cambiarEstadoReporte = async (req, res) => {
    try {
        const { estado, codigo_autorizador } = req.body;
        const payload = { estado };
        if (codigo_autorizador) payload.codigo_autorizador = codigo_autorizador;

        // 1. Guardamos la firma y el nuevo estado en la base de datos
        const { data: updatedRep, error } = await supabase.from('reportes_enviados')
            .update(payload)
            .eq('id', req.params.id)
            .select()
            .single();
            
        if (error) throw error;

        // 🚀 RESPUESTA INMEDIATA: Liberamos la pantalla del jefe sin retrasos
        res.json({ success: true, mensaje: `Reporte actualizado a: ${estado}` });

        // 📧 ENVÍO EN SEGUNDO PLANO (Background): El servidor se queda enviando correos solo
        supabase.from('usuarios').select('*').eq('codigo', updatedRep.codigo_usuario).single()
            .then(async ({ data: usrRep }) => {
                let notificaciones = [];

                if (estado === 'Autorizado y Enviado a Contabilidad') {
                    if (usrRep) {
                        notificaciones.push({
                            para_email: usrRep.email,
                            para_nombre: usrRep.nombre,
                            codigo_reporte: updatedRep.id,
                            marca: updatedRep.marca,
                            reportante_nombre: usrRep.nombre,
                            monto_total: updatedRep.monto_total,
                            estado_actual: 'Autorizado y Enviado a Contabilidad',
                            asunto_dinamico: `Actualización de Reporte N° ${updatedRep.id} - ${updatedRep.marca}`,
                            introduccion_dinamica: 'Te notificamos que tu Reporte de Variables ha cambiado de estado.',
                            detalles_adicionales: 'Tu reporte ha sido aprobado por tu jefatura y fue remitido a revisión contable.'
                        });
                    }

                    // Buscamos a todo el equipo de Contabilidad para alertarles de la bandeja pendiente
                    const { data: contadores } = await supabase.from('usuarios').select('*').ilike('rol', 'CONTADOR');
                    if (contadores && contadores.length > 0) {
                        contadores.forEach(cont => {
                            notificaciones.push({
                                para_email: cont.email,
                                para_nombre: cont.nombre,
                                codigo_reporte: updatedRep.id,
                                marca: updatedRep.marca,
                                reportante_nombre: usrRep ? usrRep.nombre : 'Reportante',
                                monto_total: updatedRep.monto_total,
                                estado_actual: 'Pendiente de Validación',
                                asunto_dinamico: `Acción Pendiente - Notificación de Reporte N° ${updatedRep.id}`,
                                introduccion_dinamica: 'Se ha registrado una actividad en el Sistema de Gestión Humana que requiere tu atención o conocimiento.',
                                detalles_adicionales: 'Un nuevo Reporte de Variables aprobado por jefatura ha ingresado a tu bandeja de Contabilidad.'
                            });
                        });
                    }
                } else if (estado === 'Denegado') {
                    if (usrRep) {
                        notificaciones.push({
                            para_email: usrRep.email,
                            para_nombre: usrRep.nombre,
                            codigo_reporte: updatedRep.id,
                            marca: updatedRep.marca,
                            reportante_nombre: usrRep.nombre,
                            monto_total: updatedRep.monto_total,
                            estado_actual: 'Denegado',
                            asunto_dinamico: `Actualización de Reporte N° ${updatedRep.id} - ${updatedRep.marca}`,
                            introduccion_dinamica: 'Te notificamos que tu Reporte de Variables ha cambiado de estado.',
                            detalles_adicionales: 'Tu reporte ha sido denegado por el autorizador. Por favor ingresa al sistema para realizar las correcciones necesarias.'
                        });
                    }
                }

                // Despachamos el arreglo de correos de forma secuencial
                for (const notif of notificaciones) {
                    await enviarCorreo(notif);
                }
            })
            .catch(err => console.error("Error al despachar correos del autorizador:", err.message));

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Busca si un código de usuario corresponde a un jefe autorizador activo.
 */
const obtenerAutorizadorMenu = async (req, res) => {
    try {
        const { data } = await supabase.from('usuarios')
            .select('nombre, email')
            .eq('codigo', req.params.codigo)
            .eq('rol', 'AUTORIZADOR')
            .eq('estado', 'Activo')
            .maybeSingle();
            
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    obtenerBandeja,
    obtenerReporteDetalle,
    cambiarEstadoReporte,
    obtenerAutorizadorMenu
};