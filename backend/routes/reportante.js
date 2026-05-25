const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

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

router.get('/mis-reportes/:periodoId/:codigoUsuario', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('reportes_enviados')
            .select('*')
            .eq('id_periodo', req.params.periodoId)
            .eq('codigo_usuario', req.params.codigoUsuario)
            .neq('estado', 'Eliminado por Usuario')
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

        if(resRep.error) throw resRep.error;
        const rep = resRep.data;
        if(!rep) throw new Error("Reporte no encontrado");
        
        const lineas = resLin.data || [];

        const codigosEmp = [...new Set((lineas || []).map(l => l.codigo_empleado).filter(Boolean))];
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

router.get('/autorizador/:codigo', async (req, res) => {
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

        // ✨ INTERCEPTOR DE FECHA: Traduce de DD/MM/YYYY a YYYY-MM-DD
        if (reporte && reporte.fecha) {
            const partes = reporte.fecha.split('/');
            if (partes.length === 3) {
                const fechaDB = `${partes[2]}-${partes[1]}-${partes[0]}`; // YYYY-MM-DD
                
                if (!idReporteEdicion) {
                    reporte.fecha_creacion = fechaDB;
                }
                
                if (reporte.estado && !['Guardado en borrador', 'Borrador'].includes(reporte.estado)) {
                    reporte.fecha_envio = fechaDB;
                }
            }
            // Elimina el campo visual para evitar que Supabase lo rechace
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
        res.json({ success: true, mensaje: "Borrador anulado lógicamente con éxito." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/cancelar/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('reportes_enviados')
            // ✨ CORRECCIÓN 1: Desvinculamos al autorizador asignándole 'null'
            .update({ estado: 'Guardado en borrador', codigo_autorizador: null })
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ success: true, mensaje: "Envío cancelado. El reporte volvió a borrador." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;