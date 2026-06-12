// src/admin/excepciones/excepciones.routes.js
const express = require('express');
const router = express.Router();

// Conectamos con su controlador especializado local
const excepcionesController = require('./excepciones.controllers');

// ============================================================================
// GESTIÓN DE EXCEPCIONES (Prórrogas de Tiempo de Gracia)
// ============================================================================
router.get('/excepciones', excepcionesController.obtenerExcepciones);
router.get('/excepcion/:id', excepcionesController.obtenerExcepcionPorId);
router.post('/excepcion', excepcionesController.crearExcepcion);
router.put('/excepcion/:id', excepcionesController.actualizarExcepcion);

module.exports = router;