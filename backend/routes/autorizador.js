const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
// Importamos el motor de correos seguro
const { enviarCorreo } = require('../services/emailService');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

router.get('/inicial', async (req, res) => {
    try {
        // ✨ AGREGADO: Sumamos la consulta a tu nueva tabla configuraciones_sistema
        const [resM, resC, resV, resP, resConf] = await Promise.all([
            supabase.from('maestro_marcas').select('*'),
            supabase.from('maestro_centro_costos').select('*'),
            supabase.from('maestro_variables').select('*'),
            supabase.from('periodos').select('*').order('codigo_periodo', { ascending: false }),
            supabase.from('configuraciones_sistema').select('valor').eq('clave', 'porcentaje_cargo_marca').maybeSingle()
        ]);
        
        res.json({
            success: true,
            marcas: resM.data || [],
            centrosCosto: resC.data || [],
            variables: resV.data || [],
            periodos: resP.data || [] ,
            // 🚀 Enviamos el porcentaje guardado. Si no existiera en la BD por algún motivo, 
            // dejamos el 0.1725 de salvavidas para que no falle el frontend.
            porcentajeCargoMarca: resConf.data?.valor ?? 0.1725
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/excepcion/:periodoId/:codigoEmpleado', async (req, res) => {
    try {
        const { data } = await supabase
            .from('excepciones_periodo')
            .select('*')
            .eq('id_periodo', req.params.periodoId)
            .or(`codigo_empleado.eq.${req.params.codigoEmpleado},codigo_autorizador.eq.${req.params.codigoEmpleado}`);
            
        res.json({ success: true, excepciones: data || [] }); 
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/bandeja/:vista/:periodoId/:codigoUsuario', async (req, res) => {
    try {
        const { vista, periodoId, codigoUsuario } = req.params;
        let query = supabase.from('reportes_enviados')
            .select('*')
            .eq('id_periodo', periodoId)
            .neq('estado', 'Eliminado por Usuario')
            .order('id', { ascending: false });

        if (vista === 'AUTORIZACIONES') {
            query = query.eq('codigo_autorizador', codigoUsuario)
                         .neq('codigo_usuario', codigoUsuario)
                         .neq('estado', 'Guardado en borrador')
                         .neq('estado', 'Borrador');
        } else {
            query = query.eq('codigo_usuario', codigoUsuario);
        }

        const { data, error } = await query;
        if(error) throw error;
        
        res.json({ success: true, data: data || [] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/reporte/:id', async (req, res) => {
    try {
        const idReporte = req.params.id;
        
        const [resRep, resLin] = await Promise.all([
            supabase.from('reportes_enviados').select('*').eq('id', idReporte).maybeSingle(),
            supabase.from('registro_variables').select('*').eq('id_reporte', idReporte)
        ]);

        if(resRep.error) throw resRep.error;
        const rep = resRep.data;
        if(!rep) throw new Error("Reporte no encontrado");
        
        const lineas = resLin.data || [];

        const codigosEmp = [...new Set((lineas).map(l => l.codigo_empleado).filter(Boolean))];
        let empleados = [];
        if(codigosEmp.length > 0 && rep.id_periodo) {
            const { data } = await supabase.from('maestro_empleados')
                .select('codigo_empleado, nombres_apellidos, puesto')
                .in('codigo_empleado', codigosEmp)
                .eq('id_periodo', rep.id_periodo);
            empleados = data || [];
        }

        const usersIds = [rep.codigo_usuario, rep.codigo_autorizador, rep.codigo_contador, rep.codigo_recepcion].filter(Boolean);
        let firmantes = [];
        if(usersIds.length > 0) {
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
        res.status(500).json({ error: error.message });
    }
});

router.put('/estado/:id', async (req, res) => {
    try {
        const { estado, codigo_autorizador } = req.body;
        const payload = { estado };
        if (codigo_autorizador) payload.codigo_autorizador = codigo_autorizador;

        // Recuperamos el reporte actualizado directamente de la BD
        const { data: updatedRep, error } = await supabase.from('reportes_enviados')
            .update(payload)
            .eq('id', req.params.id)
            .select()
            .single();
            
        if (error) throw error;

        // ✨ GENERACIÓN DE NOTIFICACIONES (Firma del Autorizador)
        let notificaciones = [];
        const { data: usrRep } = await supabase.from('usuarios').select('*').eq('codigo', updatedRep.codigo_usuario).single();

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

            // Enviar alerta a la bandeja del Contador
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
                        detalles_adicionales: 'Un nuevo Reporte de Variables aprobado por jefatura ha ingresado a tu bandeja de Contabilidad y se encuentra pendiente de validación.'
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
                    detalles_adicionales: 'Tu reporte ha sido denegado por el autorizador. Por favor ingresa al SGP para realizar las correcciones necesarias.'
                });
            }
        }

        // Disparamos los correos de forma asíncrona desde el servidor
        if (notificaciones.length > 0) {
            for (const notif of notificaciones) {
                await enviarCorreo(notif);
            }
        }

        // Paso 4 integrado: Blindamos la respuesta ocultando el arreglo al frontend
        res.json({ success: true, mensaje: `Reporte actualizado a: ${estado}` });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/verificar-empleados', async (req, res) => {
    try {
        const { codigos, id_periodo } = req.body;
        const { data } = await supabase.from('maestro_empleados')
            .select('codigo_empleado, nombres_apellidos, puesto')
            .in('codigo_empleado', codigos)
            .eq('id_periodo', id_periodo);
            
        res.json({ success: true, data: data || [] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/buscar-autorizador/:codigo', async (req, res) => {
    try {
        const { data } = await supabase.from('usuarios')
            .select('nombre, email')
            .eq('codigo', req.params.codigo)
            .eq('rol', 'AUTORIZADOR')
            .eq('estado', 'Activo')
            .maybeSingle();
            
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/upload', async (req, res) => {
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
        res.status(500).json({ error: error.message });
    }
});

router.post('/guardar', async (req, res) => {
    try {
        const { reporte, lineas, idReporteEdicion } = req.body;
        let idReporteGenerado = idReporteEdicion;

        if (reporte && reporte.fecha) {
            const partes = reporte.fecha.split('/');
            if (partes.length === 3) {
                const fechaDB = `${partes[2]}-${partes[1]}-${partes[0]}`; 
                
                if (!idReporteEdicion) {
                    reporte.fecha_creacion = fechaDB;
                }
                
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

        // ✨ GENERACIÓN DE NOTIFICACIÓN: Si el autorizador-reportante envía
        let notificaciones = [];
        if (reporte && reporte.estado === 'Pendiente de Autorización' && reporte.codigo_autorizador) {
            const { data: users } = await supabase.from('usuarios')
                .select('codigo, nombre, email')
                .in('codigo', [reporte.codigo_usuario, reporte.codigo_autorizador].filter(Boolean));
            
            const reportanteObj = users?.find(u => u.codigo === reporte.codigo_usuario);
            const autorizadorObj = users?.find(u => u.codigo === reporte.codigo_autorizador);

            if (reportanteObj && autorizadorObj) {
                notificaciones.push({
                    para_email: autorizadorObj.email,
                    para_nombre: autorizadorObj.nombre,
                    codigo_reporte: idReporteGenerado,
                    marca: reporte.marca || 'N/A',
                    reportante_nombre: reportanteObj.nombre,
                    monto_total: reporte.monto_total || '0.00',
                    estado_actual: 'Pendiente de Autorización',
                    asunto_dinamico: `Acción Pendiente - Notificación de Reporte N° ${idReporteGenerado}`,
                    introduccion_dinamica: 'Se ha registrado una actividad en el Sistema de Gestión Humana que requiere tu atención o conocimiento.',
                    detalles_adicionales: 'Tienes un nuevo Reporte de Variables asignado que requiere tu firma de aprobación.'
                });
            }
        }

        res.json({ success: true, mensaje: "Guardado correctamente", id_reporte: idReporteGenerado, notificaciones });
    } catch (error) {
        console.error("Error al guardar reporte:", error);
        res.status(500).json({ error: error.message });
    }
});

router.put('/eliminar/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('reportes_enviados')
            .update({ estado: 'Eliminado por Usuario' })
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ success: true, mensaje: "Borrador de autorizador anulado con éxito." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;