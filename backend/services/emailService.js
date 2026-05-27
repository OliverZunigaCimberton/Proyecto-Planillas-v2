// services/emailService.js

/**
 * Función centralizada para enviar un correo electrónico a través de la API REST de EmailJS.
 * Al ejecutarse en el backend, utiliza de forma segura las llaves ocultas del archivo .env.
 * @param {Object} plantillaParams - Objeto con las variables dinámicas de tu Template de EmailJS
 * @param {String} templateId - ID de la plantilla específica a enviar (opcional)
 */
const enviarCorreo = async (plantillaParams, templateId) => {
    try {
        // 1. Preparamos el cuerpo de la petición exactamente como lo requiere la API de EmailJS
        const payload = {
            service_id: process.env.EMAILJS_SERVICE_ID,
            // Si pasamos un templateId lo usa, si no, agarra el de variables por defecto
            template_id: templateId || process.env.EMAILJS_TEMPLATE_VARIABLES,
            user_id: process.env.EMAILJS_PUBLIC_KEY,
            accessToken: process.env.EMAILJS_PRIVATE_KEY, 
            // Pasamos plantillaParams completo para que acepte las variables de cualquier plantilla
            template_params: plantillaParams
        };

        // 2. Realizamos la llamada HTTP asíncrona hacia los servidores oficiales de EmailJS
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        // 3. Evaluamos la respuesta del servidor de correos
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`EmailJS respondió con código ${response.status}: ${errorText}`);
        }

        // ✨ OPTIMIZACIÓN: Soporta dinámicamente el formato de correo de cualquier plantilla
        console.log(`📧 CORREO ENVIADO CON ÉXITO A: ${plantillaParams.para_email || plantillaParams.to_email}`);
        return true;

    } catch (error) {
        // ✨ OPTIMIZACIÓN: Evita imprimir 'undefined' en la consola si ocurre un fallo
        console.error(`💥 FALLO EN EL ENVÍO DE CORREO A [${plantillaParams.para_email || plantillaParams.to_email}]:`, error.message);
        return false; // Retornamos false para que el servidor no se caiga si falla un correo
    }
};

module.exports = {
    enviarCorreo
};