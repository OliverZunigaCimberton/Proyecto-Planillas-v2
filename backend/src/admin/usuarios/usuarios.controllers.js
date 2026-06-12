// src/admin/usuarios/usuarios.controllers.js
const supabase = require('../../config/supabase');
const usuariosService = require('./usuarios.services');

/**
 * Obtiene la lista completa de colaboradores ordenada alfabéticamente por nombre.
 */
const obtenerUsuarios = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .order('nombre', { ascending: true });
            
        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Consulta el perfil completo de un usuario filtrando por su código único de empleado.
 */
const obtenerUsuarioPorCodigo = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('codigo', req.params.codigo)
            .single();
            
        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Coordina la creación de un nuevo colaborador en la plataforma a través del servicio local.
 */
const crearUsuario = async (req, res) => {
    try {
        const resultado = await usuariosService.registrarUsuario(req.body.payload);
        res.json(resultado);
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

/**
 * Coordina la edición de los parámetros y módulos de un colaborador existente.
 */
const actualizarUsuario = async (req, res) => {
    try {
        const resultado = await usuariosService.modificarUsuario(req.params.codigo, req.body.payload);
        res.json(resultado);
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

module.exports = {
    obtenerUsuarios,
    obtenerUsuarioPorCodigo,
    crearUsuario,
    actualizarUsuario
};