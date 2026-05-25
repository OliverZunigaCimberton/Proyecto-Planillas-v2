// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Conexión segura a la Base de Datos usando las llaves ocultas
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// ============================================================================
// 1. INICIO DE SESIÓN DE COLABORADORES (POST /api/auth/login)
// ============================================================================
router.post('/login', async (req, res) => {
    const { correo } = req.body;
    
    console.log(`\n-----------------------------------------------------------`);
    console.log(`🔍 INTENTO DE INGRESO CORPORATIVO: ${correo}`);

    if (!correo) {
        return res.status(400).json({ success: false, error: "El correo electrónico es obligatorio." });
    }

    try {
        // 1. Buscar al usuario en el maestro por su correo electrónico único
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', correo); 

        if (error) throw error;

        // 2. Controlar si el registro no existe en la base de datos
        if (!data || data.length === 0) {
            console.log("⚠️ RECHAZADO: El correo ingresado no existe en el sistema.");
            return res.status(404).json({ success: false, error: "Usuario no encontrado." });
        }

        const usuarioDb = data[0];
        
        // 3. TRADUCTOR / NORMALIZADOR: Homologa las columnas de Supabase al estándar del Frontend
        const usuarioNormalizado = {
            correo: usuarioDb.email,      
            nombre: usuarioDb.nombre,
            rol: usuarioDb.rol,
            codigo: usuarioDb.codigo,     
            modulos: usuarioDb.modulos,   
            estado: usuarioDb.estado
        };
        
        const estadoDb = String(usuarioNormalizado.estado || "").trim().toUpperCase();

        // 4. Bloqueo de seguridad preventivo si el usuario está inactivo o de baja
        if (estadoDb !== 'ACTIVO') {
            console.log(`⚠️ RECHAZADO: Acceso denegado. El estado del usuario es "${estadoDb}".`);
            return res.status(403).json({ success: false, error: "El usuario no se encuentra activo en el sistema." });
        }

        console.log(`🎉 ¡APROBADO! Sesión concedida para: ${usuarioNormalizado.nombre} (${usuarioNormalizado.rol})`);
        
        // Retorna éxito total y el payload limpio que consumirá el AuthProvider de React
        res.json({
            success: true,
            usuario: usuarioNormalizado
        });

    } catch (err) {
        console.log("💥 ERROR CRÍTICO CONTROLADO EN POST /login:", err.message);
        res.status(500).json({ success: false, error: "Error interno del servidor", detalle: err.message });
    }
});

module.exports = router;