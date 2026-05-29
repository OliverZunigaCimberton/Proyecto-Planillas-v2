// src/utils/dateValidation.js

/**
 * 👑 REGLA DE ORO CENTRALIZADA: Verificación de Tiempos de Gracia
 * Evalúa si el tiempo para operar en un periodo se ha agotado, 
 * considerando la fecha global de corte y las excepciones (prórrogas) individuales.
 * * @param {Object} periodo - Objeto del periodo actual (estado, fecha_corte, hora_corte).
 * @param {Array|Object} excepciones - Lista de excepciones o excepción única aplicable.
 * @param {String|Number} userCodigo - Código del empleado actual.
 * @param {String} modoVista - Rol en el que se está validando ('CREADOR', 'JUEZ', etc.).
 * @param {Object} excepcionLocal - (Opcional) Excepción específica cargada en un reporte.
 * @returns {Boolean} - Retorna true si el tiempo SE AGOTÓ, false si AÚN HAY TIEMPO.
 */
export const checkTiempoAgotado = (periodo, excepciones, userCodigo, modoVista = 'CREADOR', excepcionLocal = null) => {
    // Si no hay periodo cargado, por seguridad no bloqueamos la interfaz
    if (!periodo) return false; 

    // 1. Cierres absolutos del sistema
    const estadoActual = periodo.estado?.toString().trim().toUpperCase();
    if (estadoActual === 'CERRADO' || estadoActual === 'INACTIVO') return true;

    // 2. Cálculo del vencimiento global
    let globalExpirado = false;
    if (periodo.fecha_corte && periodo.hora_corte) {
        const finGlobal = new Date(`${periodo.fecha_corte}T${periodo.hora_corte}`).getTime();
        globalExpirado = new Date().getTime() > finGlobal;
    }

    // Si el tiempo global NO ha expirado, el sistema sigue abierto para todos
    if (!globalExpirado) return false;

    // 3. Si el global expiró, buscamos prórrogas (Excepciones)
    let excAplicable = null;
    const listaExcepciones = Array.isArray(excepciones) ? excepciones : [];

    if (modoVista === 'CREADOR') {
        excAplicable = listaExcepciones.find(e => 
            String(e.codigo_empleado) === String(userCodigo) && 
            (e.tipo_permiso || 'CREAR') === 'CREAR'
        );
    } else if (modoVista === 'JUEZ') {
        if (excepcionLocal) {
            excAplicable = excepcionLocal;
        } else {
            excAplicable = listaExcepciones.find(e => 
                String(e.codigo_autorizador) === String(userCodigo) &&
                e.tipo_permiso === 'AUTORIZAR'
            );
        }
    }

    // 4. Verificación de la vigencia de la prórroga
    if (excAplicable && excAplicable.nueva_fecha_corte) {
        // Asegurar un fallback para la hora en caso de que venga null
        const horaCorteExcepcion = excAplicable.nueva_hora_corte ? excAplicable.nueva_hora_corte.substring(0, 8) : '23:59:59';
        const finGracia = new Date(`${excAplicable.nueva_fecha_corte.split('T')[0]}T${horaCorteExcepcion}`).getTime();
        
        return new Date().getTime() > finGracia; // Si ya pasó la fecha de la prórroga, se agotó
    }

    // Si expiró el global y no hubo prórroga, se acabó el tiempo.
    return true;
};