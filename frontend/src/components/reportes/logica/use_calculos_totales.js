// src/components/reportes/modal_maestro/logica/use_calculos_totales.js
import { useMemo } from 'react';

export const useCalculosTotales = (lineas, aplicaCargoMarca) => {
    // useMemo memoriza el resultado y solo vuelve a calcular si 'lineas' o 'aplicaCargoMarca' cambian.
    // Esto optimiza el rendimiento enormemente.
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

        // Calculamos el 17.25% solo si aplica
        const cargoCalculado = aplicaCargoMarca === 'Si' ? subtotalCalculado * 0.1725 : 0;
        
        // Total final
        const totalCalculado = subtotalCalculado + cargoCalculado;

        return { 
            subtotal: subtotalCalculado, 
            montoCargoMarca: cargoCalculado, 
            totalGeneral: totalCalculado 
        };
    }, [lineas, aplicaCargoMarca]);

    return totales;
};