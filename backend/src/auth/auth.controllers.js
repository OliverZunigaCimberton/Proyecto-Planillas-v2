// src/auth/auth.controllers.js
const supabase = require('../config/supabase');
const { enviarCorreo } = require('../shared/correo.services');

/**
 * Gestiona el intento de ingreso de un colaborador y despacha su llave dinámica por correo.
 */
const iniciarSesion = async (req, res) => {
    const { correo } = req.body;
    
    console.log(`\n-----------------------------------------------------------`);
    console.log(`🔍 INTENTO DE INGRESO CORPORATIVO: ${correo}`);

    // Validación preventiva básica
    if (!correo) {
        return res.status(400).json({ success: false, error: "El correo electrónico es obligatorio." });
    }

    try {
        // 1. Buscar al usuario en la base de datos por su correo electrónico único
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', correo); 

        if (error) throw error;

        // 2. Controlar si el registro no existe en el sistema
        if (!data || data.length === 0) {
            console.log("⚠️ RECHAZADO: El correo ingresado no existe en el sistema.");
            return res.status(404).json({ success: false, error: "Usuario no encontrado." });
        }

        const usuarioDb = data[0];
        
        // 3. TRADUCTOR: Homologa las columnas de Supabase al formato que espera tu pantalla (frontend)
        const usuarioNormalizado = {
            correo: usuarioDb.email,      
            nombre: usuarioDb.nombre,
            rol: usuarioDb.rol,
            codigo: usuarioDb.codigo,     
            modulos: usuarioDb.modulos,   
            estado: usuarioDb.estado
        };
        
        const estadoDb = String(usuarioNormalizado.estado || "").trim().toUpperCase();

        // 4. Bloqueo de seguridad si el colaborador está inactivo o de baja
        if (estadoDb !== 'ACTIVO') {
            console.log(`⚠️ RECHAZADO: Acceso denegado. El estado del usuario es "${estadoDb}".`);
            return res.status(403).json({ success: false, error: "El usuario no se encuentra activo en el sistema." });
        }

        console.log(`🎉 ¡APROBADO! Sesión concedida para: ${usuarioNormalizado.nombre} (${usuarioNormalizado.rol})`);
        
        // 5. GENERACIÓN SEGURA DEL TOKEN OTP (Se crea al azar en el servidor)
        const tokenOTP = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Ciframos el token en Base64 para que la pantalla valide sin conocer el texto plano directamente
        const otpHash = Buffer.from(tokenOTP).toString('base64'); 

        // 6. DESPACHO DEL CORREO (Llamamos a nuestro servicio centralizado de mensajería en shared)
        await enviarCorreo({
            to_email: usuarioNormalizado.correo,
            otp_token: tokenOTP,
            user_name: usuarioNormalizado.nombre
        }, process.env.EMAILJS_TEMPLATE_OTP);

        console.log(`🔑 Token OTP enviado con éxito a: ${usuarioNormalizado.correo}`);

        // Devolvemos el éxito total y los datos que la pantalla necesita para dejar pasar al usuario
        res.json({
            success: true,
            usuario: usuarioNormalizado,
            otpHash
        });

    } catch (err) {
        console.log("💥 ERROR CONTROLADO EN CONTROLADOR DE AUTENTICACIÓN:", err.message);
        res.status(500).json({ success: false, error: "Error interno del servidor", detalle: err.message });
    }
};

module.exports = {
    iniciarSesion
};