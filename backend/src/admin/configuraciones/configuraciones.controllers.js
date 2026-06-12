// src/admin/configuraciones/configuraciones.controllers.js
const supabase = require('../../config/supabase');
const periodosService = require('../periodos/periodos.services');

/**
 * Actualiza el porcentaje de recargo corporativo dejando un registro histórico.
 */
const actualizarPorcentajeRecargo = async (req, res) => {
    try {
        const { nuevoPorcentaje } = req.body;
        if (nuevoPorcentaje === undefined || isNaN(parseFloat(nuevoPorcentaje))) {
            return res.status(400).json({ success: false, error: "El valor del porcentaje enviado no es válido." });
        }

        const tieneAbiertos = await periodosService.tienePeriodosAbiertos();
        if (tieneAbiertos) {
            return res.status(400).json({ 
                success: false, 
                error: "Operación denegada: No se puede modificar el porcentaje de recargo corporativo mientras exista una quincena en estado ABIERTO." 
            });
        }

        const { error } = await supabase
            .from('configuraciones_sistema')
            .insert([{ clave: 'porcentaje_cargo_marca', valor: parseFloat(nuevoPorcentaje) }]);

        if (error) throw error;
        res.json({ success: true, mensaje: "Nuevo registro de porcentaje guardado con éxito." });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// ============================================================================
// LÓGICA OPERATIVA: CATÁLOGO DE MARCAS (maestro_marcas)
// ============================================================================

const obtenerMarcas = async (req, res) => {
    try {
        const { data, error } = await supabase.from('maestro_marcas').select('*').order('id', { ascending: true });
        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const crearMarca = async (req, res) => {
    try {
        const datos = req.body.payload || req.body;
        const nombreFinal = datos.nombre_marca || datos.nombre || datos.nombreMarca;

        if (!nombreFinal || !String(nombreFinal).trim()) {
            return res.status(400).json({ success: false, error: "El nombre de la marca es obligatorio." });
        }

        const { data: marcasActuales } = await supabase.from('maestro_marcas').select('id').order('id', { ascending: false }).limit(1);
        let siguienteId = 1;
        if (marcasActuales && marcasActuales.length > 0) siguienteId = parseInt(marcasActuales[0].id, 10) + 1;

        const { data, error } = await supabase.from('maestro_marcas').insert([{ id: siguienteId, nombre_marca: String(nombreFinal).trim().toUpperCase() }]).select();
        if (error) throw error;
        res.json({ success: true, data: data[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const actualizarMarca = async (req, res) => {
    try {
        const { id } = req.params;
        const datos = req.body.payload || req.body;
        const nombreFinal = datos.nombre_marca || datos.nombre || datos.nombreMarca;

        const { data, error } = await supabase.from('maestro_marcas').update({ nombre_marca: String(nombreFinal).trim().toUpperCase() }).eq('id', parseInt(id, 10)).select();
        if (error) throw error;
        res.json({ success: true, data: data[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const eliminarMarca = async (req, res) => {
    try {
        const { error } = await supabase.from('maestro_marcas').delete().eq('id', parseInt(req.params.id, 10));
        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// ============================================================================
// LÓGICA OPERATIVA: CATÁLOGO DE VARIABLES (maestro_variables) con Trazabilidad
// ============================================================================

const obtenerVariables = async (req, res) => {
    console.log("🔍 [API] TRAFICO: Recuperando catálogo de variables...");
    try {
        const { data, error } = await supabase.from('maestro_variables').select('*').order('codigo_variable', { ascending: true });
        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        console.error("💥 [ERROR OBTENER VARIABLES]:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

const crearVariable = async (req, res) => {
    console.log("\n➕ [API] TRAFICO: Intento de CREAR variable contable");
    console.log("📦 Payload recibido en body:", req.body);
    try {
        const datos = req.body.payload || req.body;
        const codigoFinal = datos.codigo_variable || datos.codigo || datos.codigoVariable;
        const nombreFinal = datos.nombre_variable || datos.nombre || datos.nombreVariable;

        if (!codigoFinal || !nombreFinal) {
            console.log("⚠️ [RECHAZADO]: Faltan parámetros obligatorios de código o descripción.");
            return res.status(400).json({ success: false, error: "El código y la descripción son requeridos." });
        }

        const { data: variablesActuales } = await supabase.from('maestro_variables').select('id').order('id', { ascending: false }).limit(1);
        let siguienteId = 1;
        if (variablesActuales && variablesActuales.length > 0) siguienteId = parseInt(variablesActuales[0].id, 10) + 1;

        const { data, error } = await supabase.from('maestro_variables').insert([{
            id: siguienteId,
            codigo_variable: String(codigoFinal).trim().toUpperCase(),
            nombre_variable: String(nombreFinal).trim()
        }]).select();

        if (error) {
            console.error("💥 [ERROR DE INSERCIÓN SUPABASE]:", error.message);
            throw error;
        }
        console.log("✅ [ÉXITO]: Variable añadida al catálogo ->", data[0]);
        res.json({ success: true, data: data[0] });
    } catch (error) {
        console.error("💥 [ERROR CONTROLADO EN CREAR VARIABLE]:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

const actualizarVariable = async (req, res) => {
    console.log(`\n📝 [API] TRAFICO: Intento de ACTUALIZAR variable ID: ${req.params.id}`);
    console.log("📦 Payload recibido en body:", req.body);
    try {
        const { id } = req.params;
        const datos = req.body.payload || req.body;
        const codigoFinal = datos.codigo_variable || datos.codigo || datos.codigoVariable;
        const nombreFinal = datos.nombre_variable || datos.nombre || datos.nombreVariable;

        const { data, error } = await supabase.from('maestro_variables').update({
            codigo_variable: String(codigoFinal).trim().toUpperCase(),
            nombre_variable: String(nombreFinal).trim()
        }).eq('id', parseInt(id, 10)).select();

        if (error) {
            console.error("💥 [ERROR DE ACTUALIZACIÓN SUPABASE]:", error.message);
            throw error;
        }
        console.log("✅ [ÉXITO]: Variable modificada correctamente ->", data[0]);
        res.json({ success: true, data: data[0] });
    } catch (error) {
        console.error("💥 [ERROR CONTROLADO EN ACTUALIZAR VARIABLE]:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

const eliminarVariable = async (req, res) => {
    console.log(`\n❌ [API] TRAFICO: Intento de ELIMINAR variable ID: ${req.params.id}`);
    try {
        const { error } = await supabase.from('maestro_variables').delete().eq('id', parseInt(req.params.id, 10));
        if (error) {
            console.error("💥 [ERROR DE ELIMINACIÓN SUPABASE]:", error.message);
            throw error;
        }
        console.log(`✅ [ÉXITO]: Variable ID ${req.params.id} removida físicamente.`);
        res.json({ success: true });
    } catch (error) {
        console.error("💥 [ERROR CONTROLADO EN ELIMINAR VARIABLE]:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    actualizarPorcentajeRecargo,
    obtenerMarcas,
    crearMarca,
    actualizarMarca,
    eliminarMarca,
    obtenerVariables,
    crearVariable,
    actualizarVariable,
    eliminarVariable
};