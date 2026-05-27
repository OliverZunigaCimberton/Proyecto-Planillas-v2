// src/components/reportes/modal_maestro/logica/use_calculos_totales.js
import { useMemo } from 'react';

// ✨ AHORA RECIBE 'porcentajeDinamico' DESDE LA CONFIGURACIÓN DE LA BASE DE DATOS
export const useCalculosTotales = (lineas, aplicaCargoMarca, porcentajeDinamico) => {
    
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

        // 🛡️ RESPALDO: Si por algún retraso de red o error no viniera el dato, 
        // usa el 17.25% de fábrica para que el sistema nunca deje de operar.
        const factorAplicable = porcentajeDinamico !== undefined && porcentajeDinamico !== null
            ? parseFloat(porcentajeDinamico)
            : 0.1725;

        // Calculamos el cargo usando el factor real de la Base de Datos
        const cargoCalculado = aplicaCargoMarca === 'Si' ? subtotalCalculado * factorAplicable : 0;
        
        // Total final
        const totalCalculado = subtotalCalculado + cargoCalculado;

        return { 
            subtotal: subtotalCalculado, 
            montoCargoMarca: cargoCalculado, 
            totalGeneral: totalCalculado 
        };
    // 🌟 Vigilamos 'porcentajeDinamico' para recalcular si el administrador lo cambia
    }, [lineas, aplicaCargoMarca, porcentajeDinamico]);

    return totales;
};