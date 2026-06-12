// src/fases/variables/controllers/compartido.js
const supabase = require('../../../config/supabase');
const { enviarCorreo } = require('../../../shared/correo.services');
const { transformarFechaParaDb } = require('../../../utils/fechas');

/**
 * Catálogos globales indispensables para renderizar formularios (Marcas, CC, Variables, Periodos).
 */
const obtenerInicial = async (req, res) => {
    try {
        const [resM, resC, resV, resP, resConf] = await Promise.all([
            supabase.from('maestro_marcas').select('*'),
            supabase.from('maestro_centro_costos').select('*'),
            supabase.from('maestro_variables').select('*'),
            supabase.from('periodos').select('*').order('codigo_periodo', { ascending: false }),
            supabase.from('configuraciones_sistema').select('valor').eq('clave', 'porcentaje_cargo_marca').order('id', { ascending: false }).limit(1).maybeSingle()
        ]);
        
        res.json({
            success: true,
            marcas: resM.data || [],
            centrosCosto: resC.data || [],
            variables: resV.data || [],
            periodos: resP.data || [],
            porcentajeCargoMarca: resConf.data?.valor ?? 0.1725
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Valida si existen tiempos de gracia o prórrogas en la quincena.
 */
const obtenerExcepciones = async (req, res) => {
    try {
        const { periodoId, codigoUsuario } = req.params;
        const { data } = await supabase
            .from('excepciones_periodo')
            .select('*')
            .eq('id_periodo', periodoId)
            .or(`codigo_empleado.eq.${codigoUsuario},codigo_autorizador.eq.${codigoUsuario}`);
            
        res.json({ success: true, data: data || [] }); 
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Verifica en tiempo real si los códigos de empleados pertenecen al periodo quincenal dinámico.
 */
const verificarEmpleados = async (req, res) => {
    try {
        const { codigos, id_periodo } = req.body;
        const { data } = await supabase.from('maestro_empleados')
            .select('codigo_empleado, nombres_apellidos, puesto')
            .in('codigo_empleado', codigos)
            .eq('id_periodo', id_periodo);
            
        res.json({ success: true, data: data || [] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Motor único de almacenamiento de archivos pesados de soporte en el Storage.
 */
const subirRespaldo = async (req, res) => {
    try {
        const { fileName, fileType, fileBase64 } = req.body;
        const buffer = Buffer.from(fileBase64, 'base64');
        const filePath = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.]/g, '_')}`;

        const { error } = await supabase.storage
            .from('respaldos_reportes')
            .upload(filePath, buffer, { contentType: fileType });
        
        if (error) throw error;

        const { data: publicData } = supabase.storage
            .from('respaldos_reportes')
            .getPublicUrl(filePath);

        res.json({ success: true, url: publicData.publicUrl, nombre: fileName });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * LA JOYA DE LA CORONA: Lógica única para insertar o editar reportes y disparar correos de fondo.
 */
const guardarReporte = async (req, res) => {
    try {
        const { reporte, lineas, idReporteEdicion } = req.body;
        let idReporteGenerado = idReporteEdicion;

        if (reporte && reporte.fecha) {
            const fechaDB = transformarFechaParaDb(reporte.fecha);
            if (fechaDB) {
                if (!idReporteEdicion) reporte.fecha_creacion = fechaDB;
                if (reporte.estado && !['Guardado en borrador', 'Borrador'].includes(reporte.estado)) {
                    reporte.fecha_envio = fechaDB;
                }
            }
            delete reporte.fecha; 
        }

        if (idReporteEdicion) {
            const { error: errRep } = await supabase.from('reportes_enviados').update(reporte).eq('id', idReporteEdicion);
            if (errRep) throw errRep;

            const { error: errDel } = await supabase.from('registro_variables').delete().eq('id_reporte', idReporteEdicion);
            if (errDel) throw errDel;
        } else {
            const { data: rep, error: errRep } = await supabase.from('reportes_enviados').insert([reporte]).select().single();
            if (errRep) throw errRep;
            idReporteGenerado = rep.id;
        }

        if (lineas && lineas.length > 0) {
            const lineasConId = lineas.map(l => ({ ...l, id_reporte: idReporteGenerado }));
            const { error: errLin } = await supabase.from('registro_variables').insert(lineasConId);
            if (errLin) throw errLin;
        }

        res.json({ success: true, mensaje: "Guardado correctamente", id_reporte: idReporteGenerado });

        // Notificaciones asíncronas automáticas si se envía a un jefe
        if (reporte && reporte.estado === 'Pendiente de Autorización' && reporte.codigo_autorizador) {
            supabase.from('usuarios')
                .select('codigo, nombre, email')
                .in('codigo', [reporte.codigo_usuario, reporte.codigo_autorizador].filter(Boolean))
                .then(({ data: users }) => {
                    const reportanteObj = users?.find(u => u.codigo === reporte.codigo_usuario);
                    const autorizadorObj = users?.find(u => u.codigo === reporte.codigo_autorizador);

                    if (reportanteObj && autorizadorObj) {
                        enviarCorreo({
                            para_email: autorizadorObj.email,
                            para_nombre: autorizadorObj.nombre,
                            codigo_reporte: idReporteGenerado,
                            marca: reporte.marca || 'N/A',
                            reportante_nombre: reportanteObj.nombre,
                            monto_total: reporte.monto_total || '0.00',
                            estado_actual: 'Pendiente de Autorización',
                            asunto_dinamico: `Acción Pendiente - Notificación de Reporte N° ${idReporteGenerado}`,
                            introduccion_dinamica: 'Se ha registrado una actividad en el Sistema de Gestión Humana que requiere tu atención.',
                            detalles_adicionales: 'Tienes un nuevo Reporte de Variables asignado que requiere tu firma de aprobación.'
                        });
                    }
                })
                .catch(err => console.error("Error al despachar correo:", err.message));
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Anulación lógica para cualquier borrador del sistema.
 */
const eliminarReporte = async (req, res) => {
    try {
        const { error } = await supabase
            .from('reportes_enviados')
            .update({ estado: 'Eliminado por Usuario' })
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ success: true, mensaje: "Borrador anulado lógicamente con éxito." });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    obtenerInicial,
    obtenerExcepciones,
    verificarEmpleados,
    subirRespaldo,
    guardarReporte,
    eliminarReporte
};