// src/fases/variables/variables.routes.js
const express = require('express');
const router = express.Router();

// Importamos la descomposición atómica de controladores de la fase
const compartidoController = require('./controllers/compartido');
const reportanteController = require('./controllers/reportante');
const autorizadorController = require('./controllers/autorizador');
const contadorController = require('./controllers/contador');
const administradorController = require('./controllers/administrador');

// ============================================================================
// 1. FUNCIONALIDADES COMPARTIDAS DEL MODAL VARIABLES (SHARED)
// ============================================================================
router.get('/shared/inicial', compartidoController.obtenerInicial);
router.get('/shared/excepcion/:periodoId/:codigoUsuario', compartidoController.obtenerExcepciones);
router.post('/shared/verificar-empleados', compartidoController.verificarEmpleados);
router.post('/shared/upload', compartidoController.subirRespaldo);
router.post('/shared/guardar', compartidoController.guardarReporte);
router.put('/shared/eliminar/:id', compartidoController.eliminarReporte);

// ============================================================================
// 2. ROL: REPORTANTE (Digitador de Variables)
// ============================================================================
router.get('/reportante/mis-reportes/:periodoId/:codigoUsuario', reportanteController.obtenerMisReportes);
router.get('/reportante/reporte/:id', reportanteController.obtenerReporteDetalle);
router.put('/reportante/cancelar/:id', reportanteController.cancelarReporte);

// ============================================================================
// 3. ROL: AUTORIZADOR (Firma de Jefaturas y Supervisores)
// ============================================================================
router.get('/autorizador/bandeja/:vista/:periodoId/:codigoUsuario', autorizadorController.obtenerBandeja);
router.get('/autorizador/reporte/:id', autorizadorController.obtenerReporteDetalle);
router.put('/autorizador/cambiar-estado/:id', autorizadorController.cambiarEstadoReporte);
router.get('/autorizador/menu-autorizador/:codigo', autorizadorController.obtenerAutorizadorMenu);

// ============================================================================
// 4. ROL: CONTADOR (Auditoría y Firma Contable)
// ============================================================================
router.get('/contador/bandeja/:periodoId', contadorController.obtenerBandeja);
router.get('/contador/reporte/:id', contadorController.obtenerReporteDetalle);
router.put('/contador/contabilizar/:id', contadorController.contabilizarReporte);

// ============================================================================
// 5. ROL: ADMINISTRADOR (Bandeja de Planillas y Recepción Final de Variables)
// ============================================================================
router.get('/admin/bandeja/:periodoId', administradorController.obtenerBandejaPlanillas);
router.get('/admin/reporte/:id', administradorController.obtenerReporteDetalle);
router.put('/admin/recepcionar/:id', administradorController.recepcionarReporte);

module.exports = router;