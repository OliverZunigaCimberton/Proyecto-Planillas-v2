// src/shared/correo.services.js

/**
 * Función centralizada para enviar un correo electrónico a través de la API REST de EmailJS.
 * @param {Object} plantillaParams - Variables dinámicas que requiere tu plantilla de EmailJS
 * @param {String} templateId - ID de la plantilla específica (Opcional)
 */
const enviarCorreo = async (plantillaParams, templateId) => {
    try {
        // 🛑 SILENCIADOR TEMPORAL DE CORREOS DE ESTATUS (Para ráfagas de prueba)
        // Si la plantilla NO es la de acceso (OTP), bloqueamos el envío real a EmailJS
        if (templateId !== process.env.EMAILJS_TEMPLATE_OTP) {
            console.log(`🚫 EmailJS Silenciado: Se bloqueó notificación de estatus para [${plantillaParams.para_email || 'Colaborador'}]`);
            return true; // Retornamos true para que el sistema continúe su flujo normal sin detenerse
        }

        // 1. Preparamos el paquete de datos tal como lo exige la API de EmailJS
        const payload = {
            service_id: process.env.EMAILJS_SERVICE_ID,
            template_id: templateId || process.env.EMAILJS_TEMPLATE_VARIABLES,
            user_id: process.env.EMAILJS_PUBLIC_KEY,
            accessToken: process.env.EMAILJS_PRIVATE_KEY, 
            template_params: plantillaParams
        };

        // 2. Realizamos el envío digital hacia los servidores de EmailJS
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        // 3. Evaluamos si el servidor de correos aceptó el mensaje
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`EmailJS respondió con código ${response.status}: ${errorText}`);
        }

        console.log(`📧 CORREO ENVIADO CON ÉXITO A: ${plantillaParams.para_email || plantillaParams.to_email}`);
        return true;

    } catch (error) {
        console.error(`💥 FALLO EN EL ENVÍO DE CORREO A [${plantillaParams.para_email || plantillaParams.to_email}]:`, error.message);
        return false; // Retornamos false para evitar que el servidor se caiga si falla el internet de los correos
    }
};

module.exports = {
    enviarCorreo
};