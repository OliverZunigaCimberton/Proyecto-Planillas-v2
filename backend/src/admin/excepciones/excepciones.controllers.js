// src/admin/excepciones/excepciones.controllers.js
const supabase = require('../../config/supabase');

/**
 * Obtiene el historial completo de prórrogas otorgadas, incluyendo los datos descriptivos 
 * del periodo, reportante y autorizador mediante cruces relacionales.
 */
const obtenerExcepciones = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('excepciones_periodo')
            .select(`
                *, 
                periodos (codigo_periodo),
                reportante:usuarios!codigo_empleado (nombre, email),
                autorizador:usuarios!codigo_autorizador (nombre, email)
            `)
            .order('id', { ascending: false });
            
        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Recupera una excepción específica por su ID junto con la información del periodo correspondiente.
 */
const obtenerExcepcionPorId = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('excepciones_periodo')
            .select(`
                *,
                reportante:usuarios!codigo_empleado (nombre, email),
                autorizador:usuarios!codigo_autorizador (nombre, email)
            `)
            .eq('id', req.params.id)
            .single();
            
        if (error) throw error;

        // Consultamos de forma complementaria el código del periodo asociado
        const { data: per } = await supabase
            .from('periodos')
            .select('id, codigo_periodo')
            .eq('id', data.id_periodo)
            .single();
            
        res.json({ success: true, data, periodo: per });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Registra una nueva prórroga de tiempo en el sistema, asegurando el tipo de permiso base.
 */
const crearExcepcion = async (req, res) => {
    try {
        const payload = req.body.payload;
        
        // Validación/Asignación preventiva server-side
        if (!payload.tipo_permiso) payload.tipo_permiso = 'CREAR'; 
        
        const { error } = await supabase
            .from('excepciones_periodo')
            .insert([payload]);
            
        if (error) throw error;
        res.json({ success: true, mensaje: "Excepción creada" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Actualiza los parámetros o vigencia de una extensión de tiempo existente.
 */
const actualizarExcepcion = async (req, res) => {
    try {
        const payload = req.body.payload;
        
        // Validación/Asignación preventiva server-side
        if (!payload.tipo_permiso) payload.tipo_permiso = 'CREAR'; 

        const { error } = await supabase
            .from('excepciones_periodo')
            .update(payload)
            .eq('id', req.params.id);
            
        if (error) throw error;
        res.json({ success: true, mensaje: "Excepción actualizada" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    obtenerExcepciones,
    obtenerExcepcionPorId,
    crearExcepcion,
    actualizarExcepcion
};