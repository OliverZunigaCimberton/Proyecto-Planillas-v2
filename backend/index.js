// index.js
require('dotenv').config(); 
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors()); 

// Permitimos que lleguen archivos (Base64) de hasta 10 Megabytes
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// --- RUTAS MODULARES ---
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

// ✨ AQUÍ ESTABA EL PROBLEMA: Faltaba conectar la nueva ruta 'shared'
const sharedRoutes = require('./routes/shared');
app.use('/api/shared', sharedRoutes);

const reportanteRoutes = require('./routes/reportante');
app.use('/api/reportante', reportanteRoutes);

const autorizadorRoutes = require('./routes/autorizador');
app.use('/api/autorizador', autorizadorRoutes);

const contadorRoutes = require('./routes/contador');
app.use('/api/contador', contadorRoutes);

app.get('/', (req, res) => {
    res.send('Servidor de Gestión Humana - Activo');
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor modular encendido en puerto ${PORT}`);
});