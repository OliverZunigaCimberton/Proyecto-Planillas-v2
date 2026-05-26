// src/services/emailService.js
import emailjs from '@emailjs/browser';

// Inicializamos EmailJS con tu llave pública actual
emailjs.init("NczwlBYPoc7OWQRJc");

/**
 * Función que recibe el arreglo de notificaciones del backend
 * y las procesa en segundo plano hacia la plantilla unificada.
 */
export const despacharNotificaciones = (notificaciones) => {
    if (!notificaciones || notificaciones.length === 0) return;

    // Procesamos cada notificación de forma asíncrona pero sin hacer 'await'
    // en el hilo principal para no bloquear la experiencia de usuario (UI).
    notificaciones.forEach(noti => {
        const templateParams = {
            para_email: noti.para_email,
            para_nombre: noti.para_nombre,
            codigo_reporte: `RV-${String(noti.codigo_reporte).padStart(5, '0')}`,
            marca: noti.marca,
            reportante_nombre: noti.reportante_nombre,
            monto_total: noti.monto_total,
            estado_actual: noti.estado_actual,
            asunto_dinamico: noti.asunto_dinamico,
            introduccion_dinamica: noti.introduccion_dinamica,
            detalles_adicionales: noti.detalles_adicionales
        };

        // Disparamos usando tu Service ID y el Template ID Unificado
        emailjs.send(
            "service_qzzi2xd",       // Tu Service ID (el mismo de authprovider)
            "template_reportante",   // El Template ID que configuramos en la Etapa 1
            templateParams
        ).then(
            (response) => console.log(`📧 SGP Correo enviado a ${noti.para_email}:`, response.status),
            (error) => console.error(`❌ SGP Error al enviar correo a ${noti.para_email}:`, error)
        );
    });
};