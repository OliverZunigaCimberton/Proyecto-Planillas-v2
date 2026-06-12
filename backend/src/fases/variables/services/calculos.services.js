// src/fases/variables/services/calculos.services.js
const supabase = require('../../../config/supabase');

/**
 * Toma una lista de reportes, busca sus líneas de dinero detalladas en la base de datos
 * y les calcula dinámicamente el Subtotal y si aplica el "Cargo a Marca".
 * @param {Array} reportes - Lista de reportes obtenidos de la base de datos
 * @returns {Array} La misma lista de reportes pero con los cálculos inyectados
 */
const inyectarCalculosBandeja = async (reportes) => {
    // Si la lista viene vacía, no hacemos nada y la devolvemos tal cual
    if (!reportes || reportes.length === 0) {
        return reportes;
    }

    try {
        // 1. Extraemos todos los IDs de los reportes para buscar sus renglones de un solo viaje
        const listaIds = reportes.map(reporte => reporte.id);

        // 2. Vamos a la tabla de "registro_variables" a traer los montos y marcas de esos IDs
        const { data: lineas, error } = await supabase
            .from('registro_variables')
            .select('id_reporte, cargo_a_marca, monto')
            .in('id_reporte', listaIds);

        if (error) throw error;

        // 3. Pasamos reporte por reporte sumando sus valores correspondientes
        reportes.forEach(reporte => {
            // Filtramos únicamente las líneas que le pertenecen a este reporte en específico
            const lineasDeEsteReporte = lineas?.filter(l => l.id_reporte === reporte.id) || [];
            
            // Regla de negocio: Si tan solo una línea dice "Si", todo el reporte lleva Cargo a Marca
            const tieneCargoMarca = lineasDeEsteReporte.some(l => l.cargo_a_marca === 'Si');
            
            // Inyectamos las respuestas directo al reporte antes de que viajen al frontend
            reporte.cargo_a_marca = tieneCargoMarca ? 'Si' : 'No';
            
            // Sumamos todos los montos de sus líneas de forma segura (convirtiendo el texto a números reales)
            reporte.subtotal = lineasDeEsteReporte.reduce((sumaAcumulada, lineaActual) => {
                return sumaAcumulada + (parseFloat(lineaActual.monto) || 0);
            }, 0);
        });

        return reportes;

    } catch (error) {
        console.error("💥 Error en el motor de fases/variables/services/calculos.services.js:", error.message);
        // Si algo falla, devolvemos los reportes originales para que la pantalla no se quede congelada
        return reportes;
    }
};

module.exports = {
    inyectarCalculosBandeja
};