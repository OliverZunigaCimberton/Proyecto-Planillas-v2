// src/admin/configuraciones/configuraciones.routes.js
const express = require('express');
const router = express.Router();

const configuracionesController = require('./configuraciones.controllers');

// ============================================================================
// CONFIGURACIONES HISTÓRICAS DEL SISTEMA
// ============================================================================
router.put('/porcentaje', configuracionesController.actualizarPorcentajeRecargo);

// ============================================================================
// MANTENIMIENTO DEL CATÁLOGO DE MARCAS
// ============================================================================
router.get('/marcas', configuracionesController.obtenerMarcas);
router.post('/marcas', configuracionesController.crearMarca);
router.put('/marcas/:id', configuracionesController.actualizarMarca);
router.delete('/marcas/:id', configuracionesController.eliminarMarca);

// ============================================================================
// MANTENIMIENTO DEL CATÁLOGO DE VARIABLES (Sincronizado con Frontend)
// ============================================================================
router.get('/variables', configuracionesController.obtenerVariables);
router.post('/variables', configuracionesController.crearVariable);
router.put('/variables/:id', configuracionesController.actualizarVariable);
router.delete('/variables/:id', configuracionesController.eliminarVariable);

module.exports = router;