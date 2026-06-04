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
        const finGlobal = new Date(`${periodo.fecha_corte.split('T')[0]}T${periodo.hora_corte}`).getTime();
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

/**
 * ✨ NUEVO: EXTRACTOR SEGURO DE FECHAS (Evita desfases de zonas horarias)
 * Toma una cadena de fecha proveniente de la base de datos (ISO o con marca de tiempo T)
 * y la limpia devolviendo exclusivamente el formato YYYY-MM-DD idóneo para los inputs de formularios.
 * * @param {String} fechaRaw - Fecha cruda de la base de datos.
 * @returns {String} - Fecha limpia (YYYY-MM-DD) o cadena vacía si no es válida.
 */
export const extraerFechaParaInput = (fechaRaw) => {
    if (!fechaRaw) return '';
    return fechaRaw.split('T')[0].split(' ')[0];
};

/**
 * ✨ NUEVO: FORMATEADOR DE HORAS PARA EL SERVIDOR
 * Asegura que la hora guarde el formato estricto de HH:MM:SS requerido por PostgreSQL/Supabase,
 * añadiendo los segundos automáticamente si el input del frontend solo proporciona HH:MM.
 * @param {String} horaRaw - Cadena de hora del formulario (ej: "18:30" o "18:30:00").
 * @returns {String} - Hora formateada "HH:MM:SS".
 */
export const formatearHoraParaServidor = (horaRaw) => {
    if (!horaRaw) return '00:00:00';
    const limpia = horaRaw.trim();
    // 🚀 CORRECCIÓN: Cambiado 'limia' por 'limpia'
    return limpia.length <= 5 ? `${limpia}:00` : limpia.substring(0, 8);
};

/**
 * ✨ NUEVO: CALCULADOR DE PARÁMETROS FINANCIEROS DE NÓMINA
 * Toma la fecha de inicio de un periodo y deduce automáticamente el mes contable (en mayúsculas)
 * y el año fiscal, previniendo errores de digitación por parte del administrador.
 * * @param {String} fechaDesde - Fecha de inicio del periodo (YYYY-MM-DD).
 * @returns {Object} - Objeto con { mes, anio } (ej: { mes: "JUNIO", anio: 2026 }).
 */
export const calcularMesYAnioPeriodo = (fechaDesde) => {
    if (!fechaDesde) return { mes: 'ENERO', anio: new Date().getFullYear() };
    
    const nombresMeses = [
        "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", 
        "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
    ];
    
    // Forzamos la interpretación local añadiendo la T00:00:00 para evitar que el huso horario reste un día
    const fechaRef = new Date(`${fechaDesde}T00:00:00`);
    
    return {
        mes: nombresMeses[fechaRef.getMonth()],
        anio: fechaRef.getFullYear()
    };
};

/**
 * ✨ NUEVO: ESCUDO CRONOLÓGICO PARA EXCEPCIONES
 * Evalúa si el periodo global de corte de variables de la empresa sigue vigente.
 * Se utiliza para impedir que el administrador otorgue tiempos de gracia individuales de forma prematura.
 * * @param {String} fechaCorte - Fecha de corte global (YYYY-MM-DD).
 * @param {String} horaCorte - Hora de corte global (HH:MM:SS).
 * @returns {Boolean} - Retorna true si el corte global YA EXPIRÓ (permitiendo dar prórrogas), false si sigue abierto.
 */
export const esPeriodoCorteExpirado = (fechaCorte, horaCorte) => {
    if (!fechaCorte || !horaCorte) return false;
    
    const finGlobal = new Date(`${fechaCorte.split('T')[0]}T${horaCorte}`).getTime();
    const ahora = new Date().getTime();
    
    return ahora > finGlobal;
};