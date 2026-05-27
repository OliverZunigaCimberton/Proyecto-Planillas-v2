const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
// Importamos el motor de correos seguro
const { enviarCorreo } = require('../services/emailService');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

router.get('/inicial', async (req, res) => {
    try {
        const [resM, resC, resV, resP] = await Promise.all([
            supabase.from('maestro_marcas').select('*'),
            supabase.from('maestro_centro_costos').select('*'),
            supabase.from('maestro_variables').select('*'),
            supabase.from('periodos').select('*').order('codigo_periodo', { ascending: false })
        ]);
        res.json({
            success: true,
            marcas: resM.data || [],
            centrosCosto: resC.data || [],
            variables: resV.data || [],
            periodos: resP.data || []
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/bandeja/:periodoId', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('reportes_enviados')
            .select('*')
            .eq('id_periodo', req.params.periodoId)
            .in('estado', ['Autorizado y Enviado a Contabilidad', 'Validado y Enviado a Planillas', 'Recibido por Planillas'])
            .order('id', { ascending: false });

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

        if (resRep.error) throw resRep.error;
        const rep = resRep.data;
        if (!rep) throw new Error("Reporte contable no encontrado en el servidor.");
        
        const lineas = resLin.data || [];

        const codigosEmp = [...new Set((lineas).map(l => l.codigo_empleado).filter(Boolean))];
        let empleados = [];
        if (codigosEmp.length > 0 && rep.id_periodo) {
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

        const { data: perDB } = await supabase.from('periodos').select('*').eq('id', rep.id_periodo).maybeSingle();

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
        res.status(500).json({ error: error.message });
    }
});

router.put('/contabilizar/:id', async (req, res) => {
    try {
        const { codigo_contador } = req.body;
        
        const { data: updatedRep, error } = await supabase.from('reportes_enviados')
            .update({ 
                estado: 'Validado y Enviado a Planillas',
                codigo_contador: codigo_contador
            })
            .eq('id', req.params.id)
            .select()
            .single();
            
        if (error) throw error;

        // ✨ GENERACIÓN DE NOTIFICACIONES (Firma del Contador)
        let notificaciones = [];
        const { data: users } = await supabase.from('usuarios')
            .select('*')
            .in('codigo', [updatedRep.codigo_usuario, updatedRep.codigo_autorizador].filter(Boolean));
            
        const usrRep = users?.find(u => u.codigo == updatedRep.codigo_usuario);
        const usrAut = users?.find(u => u.codigo == updatedRep.codigo_autorizador);

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
        
        // Enviar alerta a la bandeja de Planillas (Rol ADMIN)
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

        // Disparamos los correos de forma asíncrona desde el servidor eliminando duplicados
        if (notificaciones.length > 0) {
            // El filtro asegura que no se repita la combinación de mismo correo + mismo estado
            const notificacionesUnicas = notificaciones.filter((item, index, self) =>
                index === self.findIndex((t) => (
                    t.para_email === item.para_email && t.estado_actual === item.estado_actual
                ))
            );

            for (const notif of notificacionesUnicas) {
                await enviarCorreo(notif);
            }
        }

        // Paso 4 integrado: Blindamos la respuesta ocultando el arreglo al frontend por seguridad
        res.json({ success: true, mensaje: "Reporte Contabilizado y firmado exitosamente." });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;