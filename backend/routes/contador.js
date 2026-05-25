const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Conexión segura a la Base de Datos
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// ============================================================================
// 1. CARGA INICIAL (Catálogos y Periodos)
// ============================================================================
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

// ============================================================================
// 2. BANDEJA DE CONTABILIDAD
// ============================================================================
router.get('/bandeja/:periodoId', async (req, res) => {
    try {
        // Trae estrictamente los reportes listos para revisión contable o históricos aprobados,
        // garantizando por el filtro .in() que nunca se fuguen estados como "Borrador" o "Eliminado"
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

// ============================================================================
// 3. DETALLE ORQUESTADO DE UN REPORTE (Sincronizado con ModalMaestroReporte)
// ============================================================================
router.get('/reporte/:id', async (req, res) => {
    try {
        const idReporte = req.params.id;
        
        // 1. Traer reporte y líneas de variables
        const [resRep, resLin] = await Promise.all([
            supabase.from('reportes_enviados').select('*').eq('id', idReporte).maybeSingle(),
            supabase.from('registro_variables').select('*').eq('id_reporte', idReporte)
        ]);

        if (resRep.error) throw resRep.error;
        const rep = resRep.data;
        if (!rep) throw new Error("Reporte contable no encontrado en el servidor.");
        
        const lineas = resLin.data || [];

        // 2. Traer la información correspondiente de empleados involucrados
        const codigosEmp = [...new Set((lineas).map(l => l.codigo_empleado).filter(Boolean))];
        let empleados = [];
        if (codigosEmp.length > 0 && rep.id_periodo) {
            const { data } = await supabase.from('maestro_empleados')
                .select('codigo_empleado, nombres_apellidos, puesto')
                .in('codigo_empleado', codigosEmp)
                .eq('id_periodo', rep.id_periodo);
            empleados = data || [];
        }

        // 3. Traer los nombres de auditoría de los firmantes
        const usersIds = [rep.codigo_usuario, rep.codigo_autorizador, rep.codigo_contador, rep.codigo_recepcion].filter(Boolean);
        let firmantes = [];
        if (usersIds.length > 0) {
            const { data } = await supabase.from('usuarios').select('codigo, nombre').in('codigo', usersIds);
            firmantes = data || [];
        }

        // 4. Traer los datos informativos del periodo
        const { data: perDB } = await supabase.from('periodos').select('*').eq('id', rep.id_periodo).maybeSingle();

        // 5. Traer catálogos de respaldo locales para contingencias de renderizado
        const [resC, resV] = await Promise.all([
            supabase.from('maestro_centro_costos').select('id, nomenclatura_cc'),
            supabase.from('maestro_variables').select('id, codigo_variable, nombre_variable')
        ]);

        // Retorna el paquete de datos exacto mapeado de forma reactiva en el Frontend
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

// ============================================================================
// 4. CONTABILIZAR REPORTE (Aprobación Contable)
// ============================================================================
router.put('/contabilizar/:id', async (req, res) => {
    try {
        const { codigo_contador } = req.body;
        
        // Estampa la firma del contador activo y remite el reporte al panel de RRHH (Admin)
        const { error } = await supabase.from('reportes_enviados')
            .update({ 
                estado: 'Validado y Enviado a Planillas',
                codigo_contador: codigo_contador
            })
            .eq('id', req.params.id);
            
        if (error) throw error;
        res.json({ success: true, mensaje: "Reporte Contabilizado y firmado exitosamente." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;