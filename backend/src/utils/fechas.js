// src/utils/fechas.js

/**
 * Transforma una fecha en texto de formato humano (DD/MM/YYYY) al formato requerido por la base de datos (YYYY-MM-DD).
 * @param {string} textoFecha - Fecha enviada por el usuario (Ej: "15/04/2026")
 * @returns {string|null} Texto de fecha listo para la base de datos (Ej: "2026-04-15") o null si el formato es incorrecto
 */
const transformarFechaParaDb = (textoFecha) => {
    if (!textoFecha || typeof textoFecha !== 'string') {
        return null;
    }

    const segmentos = textoFecha.split('/');
    
    // Validamos que la fecha tenga exactamente tres partes (Día, Mes, Año)
    if (segmentos.length === 3) {
        const dia = segmentos[0];
        const mes = segmentos[1];
        const anio = segmentos[2];
        
        // Retornamos la estructura armada que le gusta a Supabase
        return `${anio}-${mes}-${dia}`;
    }

    return null;
};

module.exports = {
    transformarFechaParaDb
};