// src/index.js
// Cargamos las variables de entorno buscando el archivo .env en la raíz del proyecto
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');

const app = express();

// Configuraciones globales de tráfico y peso de archivos (Soporta Base64 pesados)
app.use(cors());
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ============================================================================
// CONEXIÓN DE LAS NUEVAS VENTANILLAS EN CAPAS (ROUTES)
// Mantenemos la compatibilidad absoluta del frontend segmentando por módulos
// ============================================================================

// 1. Núcleo de Autenticación Global
const rutaAutenticacion = require('./auth/auth.routes');
app.use('/api/auth', rutaAutenticacion);

// 2. Submundos Independientes del Panel de Administración General
const rutaPeriodos = require('./admin/periodos/periodos.routes');
const rutaUsuarios = require('./admin/usuarios/usuarios.routes');
const rutaExcepciones = require('./admin/excepciones/excepciones.routes');
const rutaConfiguraciones = require('./admin/configuraciones/configuraciones.routes');

app.use('/api/admin', rutaPeriodos);
app.use('/api/admin', rutaUsuarios);
app.use('/api/admin', rutaExcepciones);
app.use('/api/admin', rutaConfiguraciones);

// 3. Ecosistema Unificado de la Fase de Variables (Modal, Flujos y Workflow por Rol)
// Se monta sobre la raíz '/api' ya que el enrutador de variables contiene los prefijos
// correspondientes (/shared, /reportante, /autorizador, /contador, /admin) igualando el frontend.
const rutaVariablesFase = require('./fases/variables/variables.routes');
app.use('/api', rutaVariablesFase);

// ============================================================================
// DIAGNÓSTICO Y ARRANQUE DEL SERVIDOR
// ============================================================================

app.get('/', (req, res) => {
    res.send('🚀 Backend Modular en Capas V2 - Control de Planillas Activo');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n===========================================================`);
    console.log(` 🚀 ¡MIGRACIÓN EXITOSA CON ARQUITECTURA MODULAR EN CAPAS!`);
    console.log(` 📡 Servidor corriendo en: http://localhost:${PORT}`);
    console.log(`===========================================================`);
});