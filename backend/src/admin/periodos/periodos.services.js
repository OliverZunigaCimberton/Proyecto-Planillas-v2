// src/admin/periodos/periodos.services.js
const supabase = require('../../config/supabase');

/**
 * Crea un nuevo periodo quincenal en la base de datos y, opcionalmente, le inyecta su personal maestro inicial.
 * @param {Object} periodoPayload - Datos generales del periodo (fechas, mes, año, etc.)
 * @param {Array} empleadosPayload - Lista de empleados que participarán en este periodo
 */
const crearPeriodoYPersonal = async (periodoPayload, empleadosPayload) => {
    if (!periodoPayload) {
        throw new Error("La información de los parámetros del periodo es obligatoria.");
    }

    // 1. Insertamos el nuevo periodo en la base de datos (por defecto inicia ABIERTO)
    const { data: nuevoPeriodo, error: errPeriodo } = await supabase
        .from('periodos')
        .insert([{
            codigo_periodo: parseInt(periodoPayload.codigo_periodo, 10),
            fecha_desde: periodoPayload.fecha_desde,
            fecha_hasta: periodoPayload.fecha_hasta,
            fecha_corte: periodoPayload.fecha_corte,
            hora_corte: periodoPayload.hora_corte,
            mes: periodoPayload.mes,
            anio: parseInt(periodoPayload.anio, 10),
            estado: periodoPayload.estado || 'ABIERTO' // Manejo estricto ABIERTO/CERRADO
        }])
        .select()
        .single();

    if (errPeriodo) throw errPeriodo;

    // 2. Si el usuario adjuntó una lista de empleados, la ligamos de inmediato al ID del nuevo periodo
    if (empleadosPayload && empleadosPayload.length > 0) {
        const empleadosConPeriodo = empleadosPayload.map(emp => ({
            id_periodo: nuevoPeriodo.id,
            codigo_empleado: parseInt(emp.codigo_empleado, 10),
            nombres_apellidos: String(emp.nombres_apellidos || '').trim(),
            puesto: emp.puesto ? String(emp.puesto).trim() : 'N/A',
            empresa: emp.empresa ? String(emp.empresa).trim() : 'GRUPO IMBERTON'
        }));

        const { error: errEmpleados } = await supabase
            .from('maestro_empleados')
            .insert(empleadosConPeriodo);

        if (errEmpleados) throw errEmpleados;
    }

    return { success: true, mensaje: "Nuevo periodo y personal maestro creados con éxito" };
};

/**
 * Actualiza los datos de un periodo existente y permite agregarle más empleados al padrón.
 */
const actualizarPeriodoYPersonal = async (idPeriodo, periodoData, empleadosPayload) => {
    const idPeriodoInt = parseInt(idPeriodo, 10);

    // Evitamos que se intente actualizar el ID por error
    delete periodoData.id;

    // 1. Si hay datos del periodo para modificar, los actualizamos
    if (Object.keys(periodoData).length > 0) {
        if (periodoData.codigo_periodo) periodoData.codigo_periodo = parseInt(periodoData.codigo_periodo, 10);
        if (periodoData.anio) periodoData.anio = parseInt(periodoData.anio, 10);

        const { error: errPeriodo } = await supabase
            .from('periodos')
            .update(periodoData)
            .eq('id', idPeriodoInt);

        if (errPeriodo) throw errPeriodo;
    }

    // 2. Si se mandaron nuevos empleados, los agregamos al maestro vinculados a este periodo
    if (empleadosPayload && empleadosPayload.length > 0) {
        const empleadosConPeriodo = empleadosPayload.map(emp => ({
            id_periodo: idPeriodoInt,
            codigo_empleado: parseInt(emp.codigo_empleado, 10),
            nombres_apellidos: String(emp.nombres_apellidos || '').trim(),
            puesto: emp.puesto ? String(emp.puesto).trim() : 'N/A',
            empresa: emp.empresa ? String(emp.empresa).trim() : 'GRUPO IMBERTON'
        }));

        const { error: errEmpleados } = await supabase
            .from('maestro_empleados')
            .insert(empleadosConPeriodo);

        if (errEmpleados) throw errEmpleados;
    }

    return { success: true, mensaje: "Periodo y personal maestro actualizados con éxito" };
};

/**
 * Botón inteligente: Toma la lista completa de empleados de un periodo viejo y la clona en un periodo nuevo.
 */
const duplicarPersonalMaestro = async (periodoOrigenId, periodoDestinoId) => {
    // 1. Vamos a traer los empleados del periodo viejo
    const { data: empleadosOrigen, error: errGet } = await supabase
        .from('maestro_empleados')
        .select('codigo_empleado, nombres_apellidos, puesto, empresa')
        .eq('id_periodo', periodoOrigenId);

    if (errGet) throw errGet;
    if (!empleadosOrigen || empleadosOrigen.length === 0) {
        throw new Error("El periodo origen no tiene empleados para duplicar.");
    }

    // 2. Les cambiamos el ID para que apunten al nuevo periodo quincenal
    const nuevosEmpleados = empleadosOrigen.map(emp => ({
        ...emp,
        id_periodo: periodoDestinoId
    }));

    // 3. Los guardamos en masa
    const { error: errInsert } = await supabase.from('maestro_empleados').insert(nuevosEmpleados);
    if (errInsert) throw errInsert;

    return { totalDuplicados: nuevosEmpleados.length };
};

/**
 * Candado de seguridad: Revisa si existe tan solo una quincena abierta en el sistema.
 * @returns {Boolean} true si hay periodos ABIERTOS, false si todo está CERRADO.
 */
const tienePeriodosAbiertos = async () => {
    const { data, error } = await supabase
        .from('periodos')
        .select('id')
        .eq('estado', 'ABIERTO')
        .limit(1)
        .maybeSingle();

    if (error) throw error;
    return !!data; // Si encuentra un registro devuelve true, si no, devuelve false
};

module.exports = {
    crearPeriodoYPersonal,
    actualizarPeriodoYPersonal,
    duplicarPersonalMaestro,
    tienePeriodosAbiertos
};