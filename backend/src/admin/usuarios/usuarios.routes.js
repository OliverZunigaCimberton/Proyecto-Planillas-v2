// src/admin/usuarios/usuarios.routes.js
const express = require('express');
const router = express.Router();

// Conectamos con su controlador especializado local
const usuariosController = require('./usuarios.controllers');

// ============================================================================
// CONTROL DE COLABORADORES (Usuarios del Sistema)
// ============================================================================
router.get('/usuarios', usuariosController.obtenerUsuarios);
router.get('/usuario/:codigo', usuariosController.obtenerUsuarioPorCodigo);
router.post('/usuario', usuariosController.crearUsuario);
router.put('/usuario/:codigo', usuariosController.actualizarUsuario);

module.exports = router;