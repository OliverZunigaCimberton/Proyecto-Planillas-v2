// src/fases/variables/controllers/administrador.js
const supabase = require('../../../config/supabase');
const { enviarCorreo } = require('../../../shared/correo.services');

// ============================================================================
// BANDEJA DE PLANILLAS Y RECEPCIÓN FINAL (EXCLUSIVO FASE VARIABLES)
// ============================================================================

const obtenerBandejaPlanillas = async (req, res) => {
    try {
        const { data, error } = await supabase.from('reportes_enviados')
            .select('*')
            .eq('id_periodo', req.params.periodoId)
            .in('estado', ['Validado y Enviado a Planillas', 'Recibido por Planillas'])
            .order('id', { ascending: false });
        
        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const obtenerReporteDetalle = async (req, res) => {
    try {
        const idReporte = req.params.id;
        const { data: rep, error: errRep } = await supabase.from('reportes_enviados').select('*').eq('id', idReporte).maybeSingle();
        if (errRep) throw errRep;
        if (!rep) throw new Error("Reporte no encontrado");

        const { data: lineas, error: errLin } = await supabase.from('registro_variables').select('*').eq('id_reporte', idReporte);
        if (errLin) throw errLin;

        const [resPer, resC, resV] = await Promise.all([
            supabase.from('periodos').select('*').eq('id', rep.id_periodo).maybeSingle(),
            supabase.from('maestro_centro_costos').select('id, nomenclatura_cc'),
            supabase.from('maestro_variables').select('id, codigo_variable, nombre_variable')
        ]);

        const codigosEmp = [...new Set((lineas || []).map(l => l.codigo_empleado).filter(Boolean))];
        let empleados = [];
        if (codigosEmp.length > 0) {
            const { data } = await supabase.from('maestro_empleados')
                .select('codigo_empleado, nombres_apellidos, puesto')
                .in('codigo_empleado', codigosEmp)
                .eq('id_periodo', rep.id_periodo);
            empleados = data || [];
        }

        const usersIds = [rep.codigo_usuario, rep.codigo_autorizador, rep.codigo_contador, rep.codigo_recepcion].filter(Boolean);
        let firmantes = [];
        if (usersIds.length > 0) {
            const { data } = await supabase.from('usuarios').select('codigo, nombre').in('codigo', usersIds);
            firmantes = data || [];
        }

        res.json({ 
            success: true, 
            reporte: rep, 
            lineas: lineas || [], 
            periodo: resPer.data,
            catalogoCC: resC.data || [],
            catalogoVar: resV.data || [],
            empleados,
            firmantes
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const recepcionarReporte = async (req, res) => {
    const { codigo_recepcion } = req.body;
    try {
        const { data: updatedRep, error } = await supabase.from('reportes_enviados')
            .update({ estado: 'Recibido por Planillas', codigo_recepcion: codigo_recepcion })
            .eq('id', req.params.id)
            .select()
            .single();
            
        if (error) throw error;

        // Liberamos la pantalla de planillas al instante
        res.json({ success: true, mensaje: "Reporte marcado como recibido" });

        // Enviamos las alertas finales en segundo plano (Background)
        supabase.from('usuarios')
            .select('*')
            .in('codigo', [updatedRep.codigo_usuario, updatedRep.codigo_autorizador, updatedRep.codigo_contador].filter(Boolean))
            .then(async ({ data: users }) => {
                let notificaciones = [];
                const usrRep = users?.find(u => u.codigo == updatedRep.codigo_usuario);
                const usrAut = users?.find(u => u.codigo == updatedRep.codigo_autorizador);
                const usrCont = users?.find(u => u.codigo == updatedRep.codigo_contador);
                
                if (usrRep) {
                    notificaciones.push({
                        para_email: usrRep.email,
                        para_nombre: usrRep.nombre,
                        codigo_reporte: updatedRep.id,
                        marca: updatedRep.marca,
                        reportante_nombre: usrRep.nombre,
                        monto_total: updatedRep.monto_total,
                        estado_actual: 'Recibido por Planillas',
                        asunto_dinamico: `Actualización de Reporte N° ${updatedRep.id} - ${updatedRep.marca}`,
                        introduccion_dinamica: 'Te notificamos que tu Reporte de Variables ha cambiado de estado.',
                        detalles_adicionales: '¡Excelente! Tu Reporte de Variables ha sido recibido formalmente por el área de Planillas para su aplicación en nómina.'
                    });
                }
                if (usrAut) {
                    notificaciones.push({
                        para_email: usrAut.email,
                        para_nombre: usrAut.nombre,
                        codigo_reporte: updatedRep.id,
                        marca: updatedRep.marca,
                        reportante_nombre: usrRep ? usrRep.nombre : 'Reportante',
                        monto_total: updatedRep.monto_total,
                        estado_actual: 'Recibido por Planillas',
                        asunto_dinamico: `Acción Pendiente - Notificación de Reporte N° ${updatedRep.id}`,
                        introduccion_dinamica: 'Se ha registrado una actividad en el Sistema de Gestión Humana que requiere tu atención o conocimiento.',
                        detalles_adicionales: 'El Reporte de Variables de tu colaborador ha sido recibido con éxito por el área de Planillas.'
                    });
                }
                if (usrCont) {
                    notificaciones.push({
                        para_email: usrCont.email,
                        para_nombre: usrCont.nombre,
                        codigo_reporte: updatedRep.id,
                        marca: updatedRep.marca,
                        reportante_nombre: usrRep ? usrRep.nombre : 'Reportante',
                        monto_total: updatedRep.monto_total,
                        estado_actual: 'Recibido por Planillas',
                        asunto_dinamico: `Acción Pendiente - Notificación de Reporte N° ${updatedRep.id}`,
                        introduccion_dinamica: 'Se ha registrado una actividad en el Sistema de Gestión Humana que requiere tu atención o conocimiento.',
                        detalles_adicionales: 'El Reporte de Variables que auditaste ya fue recibido por el área de Planillas.'
                    });
                }

                for (const notif of notificaciones) {
                    await enviarCorreo(notif);
                }
            })
            .catch(err => console.error("Error en correos de recepción final:", err.message));
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    obtenerBandejaPlanillas,
    obtenerReporteDetalle,
    recepcionarReporte
};