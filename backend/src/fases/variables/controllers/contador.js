// src/fases/variables/controllers/contador.js
const supabase = require('../../../config/supabase');
const { enviarCorreo } = require('../../../shared/correo.services');
const { inyectarCalculosBandeja } = require('../services/calculos.services');

/**
 * Trae la bandeja de reportes listos para auditoría contable.
 * Inyecta los subtotales automáticamente usando el servicio centralizado local.
 */
const obtenerBandeja = async (req, res) => {
    try {
        const { periodoId } = req.params;
        
        // El contador solo ve reportes que ya pasaron por la aprobación de un jefe
        const { data, error } = await supabase
            .from('reportes_enviados')
            .select('*')
            .eq('id_periodo', periodoId)
            .in('estado', ['Autorizado y Enviado a Contabilidad', 'Validado y Enviado a Planillas', 'Recibido por Planillas'])
            .order('id', { ascending: false });

        if (error) throw error;
        
        // Calculamos montos globales y marcas sin duplicar código matemático
        const datosConCalculos = await inyectarCalculosBandeja(data || []);

        res.json({ success: true, data: datosConCalculos });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Carga el expediente completo de un reporte para la revisión detallada del contador.
 */
const obtenerReporteDetalle = async (req, res) => {
    try {
        const idReporte = req.params.id;
        
        // Traemos el encabezado y sus líneas de dinero en paralelo
        const [resRep, resLin] = await Promise.all([
            supabase.from('reportes_enviados').select('*').eq('id', idReporte).maybeSingle(),
            supabase.from('registro_variables').select('*').eq('id_reporte', idReporte)
        ]);

        if (resRep.error) throw resRep.error;
        const rep = resRep.data;
        if (!rep) throw new Error("Reporte contable no encontrado en el servidor.");
        
        const lineas = resLin.data || [];

        // Buscamos los datos de los empleados que aparecen en este reporte
        const codigosEmp = [...new Set(lineas.map(l => l.codigo_empleado).filter(Boolean))];
        let empleados = [];
        if (codigosEmp.length > 0 && rep.id_periodo) {
            const { data } = await supabase.from('maestro_empleados')
                .select('codigo_empleado, nombres_apellidos, puesto')
                .in('codigo_empleado', codigosEmp)
                .eq('id_periodo', rep.id_periodo);
            empleados = data || [];
        }

        // Buscamos la lista de personas que han firmado el documento
        const usersIds = [rep.codigo_usuario, rep.codigo_autorizador, rep.codigo_contador, rep.codigo_recepcion].filter(Boolean);
        let firmantes = [];
        if (usersIds.length > 0) {
            const { data } = await supabase.from('usuarios').select('codigo, nombre').in('codigo', usersIds);
            firmantes = data || [];
        }

        const { data: perDB } = await supabase.from('periodos').select('*').eq('id', rep.id_periodo).maybeSingle();

        // Traemos los catálogos de centros de costos y variables para traducir los códigos a nombres legibles
        const [resC, resV] = await Promise.all([
            supabase.from('maestro_centro_costos').select('id, nomenclatura_cc'),
            supabase.from('maestro_variables').select('id, codigo_variable, nombre_variable')
        ]);

        res.json({ 
            success: true, 
            reporte: rep, 
            lineas, 
            empleados, 
            firmantes, 
            periodo: perDB,
            catalogoCCLoc: resC.data || [],
            catalogoVarLoc: resV.data || []
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * LA FIRMA CONTABLE: Aprueba el reporte para su aplicación final en nómina.
 * Libera la pantalla de inmediato y procesa la ráfaga de correos de fondo de forma asíncrona.
 */
const contabilizarReporte = async (req, res) => {
    try {
        const { codigo_contador } = req.body;
        
        // 1. Estampamos la firma contable y cambiamos el estado en Supabase
        const { data: updatedRep, error } = await supabase.from('reportes_enviados')
            .update({ 
                estado: 'Validado y Enviado a Planillas',
                codigo_contador: codigo_contador
            })
            .eq('id', req.params.id)
            .select()
            .single();
            
        if (error) throw error;

        // 🚀 RESPUESTA INMEDIATA: El contador ve éxito en su pantalla al instante (Cero retrasos)
        res.json({ success: true, mensaje: "Reporte Contabilizado y signed exitosamente." });

        // 📧 ENVÍO EN SEGUNDO PLANO (Background): El servidor se encarga del trabajo pesado solo
        supabase.from('usuarios')
            .select('*')
            .in('codigo', [updatedRep.codigo_usuario, updatedRep.codigo_autorizador].filter(Boolean))
            .then(async ({ data: users }) => {
                let notificaciones = [];
                const usrRep = users?.find(u => u.codigo == updatedRep.codigo_usuario);
                const usrAut = users?.find(u => u.codigo == updatedRep.codigo_autorizador);

                // Alerta para el creador del reporte
                if (usrRep) {
                    notificaciones.push({
                        para_email: usrRep.email,
                        para_nombre: usrRep.nombre,
                        codigo_reporte: updatedRep.id,
                        marca: updatedRep.marca,
                        reportante_nombre: usrRep.nombre,
                        monto_total: updatedRep.monto_total,
                        estado_actual: 'Validado y Enviado a Planillas',
                        asunto_dinamico: `Actualización de Reporte N° ${updatedRep.id} - ${updatedRep.marca}`,
                        introduccion_dinamica: 'Te notificamos que tu Reporte de Variables ha cambiado de estado.',
                        detalles_adicionales: 'Tu reporte ya completó la auditoría contable con éxito.'
                    });
                }
                
                // Alerta para el jefe que autorizó
                if (usrAut) {
                    notificaciones.push({
                        para_email: usrAut.email,
                        para_nombre: usrAut.nombre,
                        codigo_reporte: updatedRep.id,
                        marca: updatedRep.marca,
                        reportante_nombre: usrRep ? usrRep.nombre : 'Reportante',
                        monto_total: updatedRep.monto_total,
                        estado_actual: 'Validado y Enviado a Planillas',
                        asunto_dinamico: `Acción Pendiente - Notificación de Reporte N° ${updatedRep.id}`,
                        introduccion_dinamica: 'Se ha registrado una actividad en el Sistema de Gestión Humana que requiere tu atención o conocimiento.',
                        detalles_adicionales: 'El reporte que autorizaste previamente ya fue auditado y firmado por Contabilidad.'
                    });
                }
                
                // Alerta masiva para todo el equipo de Planillas (Rol ADMIN)
                const { data: admins } = await supabase.from('usuarios').select('*').ilike('rol', 'ADMIN');
                if (admins && admins.length > 0) {
                    admins.forEach(admin => {
                        notificaciones.push({
                            para_email: admin.email,
                            para_nombre: admin.nombre,
                            codigo_reporte: updatedRep.id,
                            marca: updatedRep.marca,
                            reportante_nombre: usrRep ? usrRep.nombre : 'Reportante',
                            monto_total: updatedRep.monto_total,
                            estado_actual: 'Pendiente de Recepción',
                            asunto_dinamico: `Acción Pendiente - Notificación de Reporte N° ${updatedRep.id}`,
                            introduccion_dinamica: 'Se ha registrado una actividad en el Sistema de Gestión Humana que requiere tu atención o conocimiento.',
                            detalles_adicionales: 'Un nuevo Reporte de Variables unificado se encuentra listo para ser recepcionado en tu bandeja de Planillas.'
                        });
                    });
                }

                // Blindaje final: Filtramos para asegurar que no se repita un correo por el mismo estado
                if (notificaciones.length > 0) {
                    const notificacionesUnicas = notificaciones.filter((item, index, self) =>
                        index === self.findIndex((t) => (
                            t.para_email === item.para_email && t.estado_actual === item.estado_actual
                        ))
                    );

                    for (const notif of notificacionesUnicas) {
                        await enviarCorreo(notif);
                    }
                }
            })
            .catch(err => console.error("Error al procesar correos de contabilidad en segundo plano:", err.message));

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    obtenerBandeja,
    obtenerReporteDetalle,
    contabilizarReporte
};