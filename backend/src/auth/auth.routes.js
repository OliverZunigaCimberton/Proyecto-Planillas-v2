// src/auth/auth.routes.js
const express = require('express');
const router = express.Router();

// Conectamos esta ventanilla con su respectivo controlador local
const authController = require('./auth.controllers');

// Cuando la pantalla mande datos a /login, el controlador se hace cargo
router.post('/login', authController.iniciarSesion);

// Exportamos la ventanilla lista para conectarla al servidor general
module.exports = router;