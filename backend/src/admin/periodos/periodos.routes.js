// src/admin/periodos/periodos.routes.js
const express = require('express');
const router = express.Router();

// Conectamos con su controlador especializado local
const periodosController = require('./periodos.controllers');

// ============================================================================
// 1. CONTROL DE PERIODOS QUINCENALES
// ============================================================================
router.get('/periodos', periodosController.obtenerPeriodos);
router.get('/periodo/:id', periodosController.obtenerPeriodoPorId);
router.post('/periodo', periodosController.crearPeriodo);
router.put('/periodo/:id', periodosController.actualizarPeriodo);
router.post('/duplicar-personal', periodosController.duplicarPersonal);

// ============================================================================
// 2. PERSONAL MAESTRO (Padrón de Empleados)
// ============================================================================
router.get('/empleados/:idPeriodo', periodosController.obtenerEmpleadosPeriodo);
router.delete('/empleados/:idPeriodo', periodosController.eliminarEmpleadosPeriodo);
router.post('/empleado-manual', periodosController.crearEmpleadoManual);
router.delete('/empleado/:idPeriodo/:codigoEmpleado', periodosController.eliminarEmpleadoEspecifico);

module.exports = router;