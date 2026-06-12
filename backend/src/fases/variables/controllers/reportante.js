// src/fases/variables/controllers/reportante.js
const supabase = require('../../../config/supabase');
const { inyectarCalculosBandeja } = require('../services/calculos.services');

/**
 * Trae el listado histórico de reportes creados exclusivamente por este usuario.
 * Usa el motor de servicios para calcular los subtotales en tiempo real.
 */
const obtenerMisReportes = async (req, res) => {
    try {
        const { periodoId, codigoUsuario } = req.params;
        
        // Buscamos solo los reportes que le pertenecen a este usuario y que no estén borrados
        const { data, error } = await supabase
            .from('reportes_enviados')
            .select('*')
            .eq('id_periodo', periodoId)
            .eq('codigo_usuario', codigoUsuario)
            .neq('estado', 'Eliminado por Usuario')
            .order('id', { ascending: false });
            
        if (error) throw error;

        // Centralización: Calculamos subtotales y marcas sin duplicar código matemático
        const datosConCalculos = await inyectarCalculosBandeja(data || []);

        res.json({ success: true, data: datosConCalculos });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Obtiene el expediente detallado de un reporte específico para la vista del reportante.
 */
const obtenerReporteDetalle = async (req, res) => {
    try {
        const idReporte = req.params.id;
        
        // 1. Traemos el encabezado del reporte y sus renglones de dinero en paralelo
        const [resRep, resLin] = await Promise.all([
            supabase.from('reportes_enviados').select('*').eq('id', idReporte).maybeSingle(),
            supabase.from('registro_variables').select('*').eq('id_reporte', idReporte)
        ]);

        if (resRep.error) throw resRep.error;
        const rep = resRep.data;
        if (!rep) throw new Error("Reporte no encontrado en el servidor.");
        
        const lineas = resLin.data || [];

        // 2. Buscamos los nombres y puestos del personal maestro que aparece en este reporte
        const codigosEmp = [...new Set(lineas.map(l => l.codigo_empleado).filter(Boolean))];
        let empleados = [];
        if (codigosEmp.length > 0 && rep.id_periodo) {
            const { data } = await supabase.from('maestro_empleados')
                .select('codigo_empleado, nombres_apellidos, puesto')
                .in('codigo_empleado', codigosEmp)
                .eq('id_periodo', rep.id_periodo);
            empleados = data || [];
        }

        // 3. Traemos los nombres de los usuarios que han firmado o participado en el flujo
        const usersIds = [rep.codigo_usuario, rep.codigo_autorizador, rep.codigo_contador, rep.codigo_recepcion].filter(Boolean);
        let firmantes = [];
        if (usersIds.length > 0) {
            const { data } = await supabase.from('usuarios').select('codigo, nombre').in('codigo', usersIds);
            firmantes = data || [];
        }

        // 4. Traemos los límites del periodo de tiempo
        const { data: perDB } = await supabase.from('periodos').select('*').eq('id', rep.id_periodo).maybeSingle();

        // 5. Revisamos si este reporte se creó bajo un permiso especial o prórroga (Excepción)
        const { data: excepcionReporte } = await supabase
            .from('excepciones_periodo')
            .select('*')
            .eq('id_periodo', rep.id_periodo)
            .eq('codigo_empleado', rep.codigo_usuario)
            .order('id', { ascending: false })
            .limit(1)
            .maybeSingle();

        // Respondemos con todo el expediente armado
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
 * Cancela el envío de un reporte pendiente, regresándolo a estado de borrador para permitir correcciones.
 */
const cancelarReporte = async (req, res) => {
    try {
        const { error } = await supabase
            .from('reportes_enviados')
            .update({ estado: 'Guardado en borrador', codigo_autorizador: null })
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ success: true, mensaje: "Envío cancelado. El reporte volvió a borrador con éxito." });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    obtenerMisReportes,
    obtenerReporteDetalle,
    cancelarReporte
};