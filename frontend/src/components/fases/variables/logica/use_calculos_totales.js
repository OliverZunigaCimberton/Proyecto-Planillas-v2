// src/components/reportes/modal_maestro/logica/use_calculos_totales.js
import { useMemo } from 'react';

// ✨ AHORA RECIBE EL TOTAL HISTÓRICO Y EL ESTADO PARA PROTEGER LOS REPORTES DEL PASADO
export const useCalculosTotales = (lineas, aplicaCargoMarca, porcentajeDinamico, montoTotalHistorico, estadoReporte) => {
    
    const totales = useMemo(() => {
        let subtotalCalculado = 0;
        
        lineas.forEach(lin => {
            if (lin.monto) {
                // Quitamos el signo de dólar y las comas para poder sumar
                const floatVal = parseFloat(String(lin.monto).replace(/[^0-9.-]+/g, ''));
                if (!isNaN(floatVal)) {
                    subtotalCalculado += floatVal;
                }
            }
        });

        // Un reporte es histórico fijo si ya tiene un total guardado y no es un borrador modificable
        const esReporteHistoricoFijo = montoTotalHistorico && !['Borrador', 'Guardado en borrador'].includes(estadoReporte);

        let cargoCalculado;
        let totalCalculado;

        if (esReporteHistoricoFijo) {
            // 🔒 CONGELACIÓN HISTÓRICA: Respetamos el total absoluto guardado en la base de datos
            totalCalculado = parseFloat(montoTotalHistorico) || 0;
            cargoCalculado = aplicaCargoMarca === 'Si' ? (totalCalculado - subtotalCalculado) : 0;
            if (cargoCalculado < 0) cargoCalculado = 0; // Escudo ante decimales de redondeo masivos
        } else {
            // CÓMPUTO DINÁMICO: Para reportes nuevos o borradores activos usando el porcentaje de las configuraciones
            const factorAplicable = porcentajeDinamico !== undefined && porcentajeDinamico !== null
                ? parseFloat(porcentajeDinamico)
                : 0.1725;

            cargoCalculado = aplicaCargoMarca === 'Si' ? subtotalCalculado * factorAplicable : 0;
            totalCalculado = subtotalCalculado + cargoCalculado;
        }

        return { 
            subtotal: subtotalCalculado, 
            montoCargoMarca: cargoCalculado, 
            totalGeneral: totalCalculado 
        };
    // 🌟 Añadimos montoTotalHistorico y estadoReporte a la escucha del Memoizer
    }, [lineas, aplicaCargoMarca, porcentajeDinamico, montoTotalHistorico, estadoReporte]);

    return totales;
};