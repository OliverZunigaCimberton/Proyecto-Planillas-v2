// src/admin/periodos/periodos.controllers.js
const supabase = require('../../config/supabase');
const periodosService = require('./periodos.services');

// 🔄 CORRECCIÓN: Conectamos directamente al nuevo motor analítico centralizado de la Fase de Variables
const { inyectarCalculosBandeja } = require('../../fases/variables/services/calculos.services');

// ============================================================================
// 1. GESTIÓN DE PERIODOS QUINCENALES
// ============================================================================

const obtenerPeriodos = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('periodos')
            .select('*')
            .order('codigo_periodo', { ascending: false });
            
        if (error) throw error;

        // Inyectamos cálculos en tiempo real usando el nuevo motor modularizado
        const datosConCalculos = await inyectarCalculosBandeja(data || []);
        res.json({ success: true, data: datosConCalculos });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const obtenerPeriodoPorId = async (req, res) => {
    try {
        const { data, error } = await supabase.from('periodos').select('*').eq('id', req.params.id).single();
        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const crearPeriodo = async (req, res) => {
    try {
        const { periodoPayload, empleadosPayload } = req.body;
        // Delegamos la inserción segura al servicio de periodos local
        const resultado = await periodosService.crearPeriodoYPersonal(periodoPayload, empleadosPayload);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const actualizarPeriodo = async (req, res) => {
    try {
        const { empleadosPayload, ...periodoData } = req.body.payload || {};
        const resultado = await periodosService.actualizarPeriodoYPersonal(req.params.id, periodoData, empleadosPayload);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const duplicarPersonal = async (req, res) => {
    try {
        const { periodoOrigenId, periodoDestinoId } = req.body;
        const resultado = await periodosService.duplicarPersonalMaestro(periodoOrigenId, periodoDestinoId);
        res.json({ success: true, mensaje: `Se duplicaron ${resultado.totalDuplicados} empleados con éxito` });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// ============================================================================
// 2. MAESTRO DE EMPLEADOS (Padrón por quincena)
// ============================================================================

const obtenerEmpleadosPeriodo = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('maestro_empleados')
            .select('*')
            .eq('id_periodo', req.params.idPeriodo)
            .order('codigo_empleado', { ascending: true });

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const eliminarEmpleadosPeriodo = async (req, res) => {
    try {
        const { error } = await supabase.from('maestro_empleados').delete().eq('id_periodo', req.params.idPeriodo);
        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const crearEmpleadoManual = async (req, res) => {
    try {
        const { payload } = req.body;
        const { error } = await supabase
            .from('maestro_empleados')
            .insert([{
                id_periodo: parseInt(payload.id_periodo, 10),
                codigo_empleado: parseInt(payload.codigo_empleado, 10),
                nombres_apellidos: payload.nombres_apellidos.trim(),
                puesto: payload.puesto ? payload.puesto.trim() : 'N/A',
                empresa: payload.empresa ? payload.empresa.trim() : 'GRUPO IMBERTON'
            }]);

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const eliminarEmpleadoEspecifico = async (req, res) => {
    try {
        const { idPeriodo, codigoEmpleado } = req.params;
        const { error } = await supabase
            .from('maestro_empleados')
            .delete()
            .eq('id_periodo', idPeriodo)
            .eq('codigo_empleado', codigoEmpleado);

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    obtenerPeriodos,
    obtenerPeriodoPorId,
    crearPeriodo,
    actualizarPeriodo,
    duplicarPersonal,
    obtenerEmpleadosPeriodo,
    eliminarEmpleadosPeriodo,
    crearEmpleadoManual,
    eliminarEmpleadoEspecifico
};