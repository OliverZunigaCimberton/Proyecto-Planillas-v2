const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Conexión a la Base de Datos usando las llaves ocultas
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// ============================================================================
// 1. CARGA INICIAL DE CATÁLOGOS
// ============================================================================
router.get('/inicial', async (req, res) => {
    try {
        const [resM, resC, resV, resP] = await Promise.all([
            supabase.from('maestro_marcas').select('*'),
            supabase.from('maestro_centro_costos').select('*'),
            supabase.from('maestro_variables').select('*'),
            supabase.from('periodos').select('*').order('codigo_periodo', { ascending: false })
        ]);
        res.json({
            success: true,
            marcas: resM.data || [],
            centrosCosto: resC.data || [],
            variables: resV.data || [],
            periodos: resP.data || []
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// 2. GESTIÓN DE PERIODOS
// ============================================================================

// Obtener todos los periodos
router.get('/periodos', async (req, res) => {
    try {
        const { data, error } = await supabase.from('periodos').select('*').order('codigo_periodo', { ascending: false });
        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener un periodo específico
router.get('/periodos/:id', async (req, res) => {
    try {
        const { data, error } = await supabase.from('periodos').select('*').eq('id', req.params.id).single();
        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Crear nuevo periodo
router.post('/periodos', async (req, res) => {
    try {
        const { periodoPayload, empleadosPayload } = req.body;

        if (!periodoPayload) {
            return res.status(400).json({ success: false, error: "La información de los parámetros del periodo es obligatoria." });
        }

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
                estado: periodoPayload.estado || 'ABIERTO'
            }])
            .select()
            .single();

        if (errPeriodo) throw errPeriodo;

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

        res.json({ success: true, mensaje: "Nuevo periodo y personal maestro creados con éxito" });
    } catch (error) {
        console.error("Error crítico en POST /periodos:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Actualizar periodo (CORREGIDO: Separa empleadosPayload para evitar fallas de columna e inserta el personal de recarga)
router.put('/periodos/:id', async (req, res) => {
    try {
        const { empleadosPayload, ...periodoData } = req.body.payload || {};
        const idPeriodoInt = parseInt(req.params.id, 10);

        // 1. Limpiar campos de control innecesarios que React inyecta al esparcir el objeto anterior
        delete periodoData.id;

        // 2. Actualizar parámetros puros de la quincena (solo si vienen datos de formulario)
        if (Object.keys(periodoData).length > 0) {
            if (periodoData.codigo_periodo) periodoData.codigo_periodo = parseInt(periodoData.codigo_periodo, 10);
            if (periodoData.anio) periodoData.anio = parseInt(periodoData.anio, 10);

            const { error: errPeriodo } = await supabase
                .from('periodos')
                .update(periodoData)
                .eq('id', idPeriodoInt);

            if (errPeriodo) throw errPeriodo;
        }

        // 3. Si la petición proviene de la recarga masiva y trae colaboradores, insertarlos relacionalmente
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

        res.json({ success: true, mensaje: "Periodo y personal maestro actualizados con éxito" });
    } catch (error) {
        console.error("Error crítico en PUT /periodos/:id:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Duplicar personal para un nuevo periodo
router.post('/periodos/duplicar-personal', async (req, res) => {
    const { periodoOrigenId, periodoDestinoId } = req.body;
    try {
        const { data: empleadosOrigen, error: errGet } = await supabase
            .from('maestro_empleados')
            .select('codigo_empleado, nombres_apellidos, puesto, empresa')
            .eq('id_periodo', periodoOrigenId);

        if (errGet) throw errGet;
        if (!empleadosOrigen || empleadosOrigen.length === 0) {
            return res.status(400).json({ success: false, error: "El periodo origen no tiene empleados" });
        }

        const nuevosEmpleados = empleadosOrigen.map(emp => ({
            ...emp,
            id_periodo: periodoDestinoId
        }));

        const { error: errInsert } = await supabase.from('maestro_empleados').insert(nuevosEmpleados);
        if (errInsert) throw errInsert;

        res.json({ success: true, mensaje: `Se duplicaron ${nuevosEmpleados.length} empleados con éxito` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================================
// 3. ENDPOINTS PARA LA GESTIÓN DE PERSONAL MAESTRO POR PERIODO
// ============================================================================

// Obtener todos los empleados vinculados a un periodo específico
router.get('/periodos/:idPeriodo/empleados', async (req, res) => {
    try {
        const { idPeriodo } = req.params;
        const { data, error } = await supabase
            .from('maestro_empleados')
            .select('*')
            .eq('id_periodo', idPeriodo)
            .order('codigo_empleado', { ascending: true });

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Vaciar por completo el personal maestro de un periodo
router.delete('/periodos/:idPeriodo/empleados', async (req, res) => {
    try {
        const { idPeriodo } = req.params;
        const { error } = await supabase
            .from('maestro_empleados')
            .delete()
            .eq('id_periodo', idPeriodo);

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Inserción manual de un nuevo empleado en la quincena
router.post('/empleados-manual', async (req, res) => {
    try {
        const { payload } = req.body;
        const { error } = await supabase
            .from('maestro_empleados')
            .insert([{
                id_periodo: parseInt(payload.id_periodo, 10),
                codigo_empleado: parseInt(payload.codigo_empleado, 10),
                nombres_apellidos: payload.nombres_apellidos.trim(),
                puesto: payload.puesto ? payload.puesto.trim() : 'N/A',
                empresa: payload.empresa ? payload.empresa.trim() : 'GRUPO IMBERTON'
            }]);

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Remoción individual de un empleado de un periodo específico
router.delete('/periodos/:idPeriodo/empleados/:codigoEmpleado', async (req, res) => {
    try {
        const { idPeriodo, codigoEmpleado } = req.params;
        const { error } = await supabase
            .from('maestro_empleados')
            .delete()
            .eq('id_periodo', idPeriodo)
            .eq('codigo_empleado', codigoEmpleado);

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================================
// 4. BANDEJA Y REVISIÓN DE REPORTES
// ============================================================================

router.get('/bandeja/:periodoId', async (req, res) => {
    try {
        const { data, error } = await supabase.from('reportes_enviados')
            .select('*')
            .eq('id_periodo', req.params.periodoId)
            .in('estado', ['Validado y Enviado a Planillas', 'Recibido por Planillas'])
            .order('id', { ascending: false });
        
        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/reporte/:id', async (req, res) => {
    try {
        const idReporte = req.params.id;
        const { data: rep, error: errRep } = await supabase.from('reportes_enviados').select('*').eq('id', idReporte).maybeSingle();
        if (errRep) throw errRep;
        if (!rep) throw new Error("Reporte no encontrado");

        const { data: lineas, error: errLin } = await supabase.from('registro_variables').select('*').eq('id_reporte', idReporte);
        if (errLin) throw errLin;

        const [resPer, resC, resV] = await Promise.all([
            supabase.from('periodos').select('*').eq('id', rep.id_periodo).maybeSingle(),
            supabase.from('maestro_centro_costos').select('id, nomenclatura_cc'),
            supabase.from('maestro_variables').select('id, codigo_variable, nombre_variable')
        ]);

        const codigosEmp = [...new Set((lineas || []).map(l => l.codigo_empleado).filter(Boolean))];
        let empleados = [];
        if(codigosEmp.length > 0) {
            const { data } = await supabase.from('maestro_empleados')
                .select('codigo_empleado, nombres_apellidos, puesto')
                .in('codigo_empleado', codigosEmp)
                .eq('id_periodo', rep.id_periodo);
            empleados = data || [];
        }

        const usersIds = [rep.codigo_usuario, rep.codigo_autorizador, rep.codigo_contador, rep.codigo_recepcion].filter(Boolean);
        let firmantes = [];
        if(usersIds.length > 0) {
            const { data } = await supabase.from('usuarios').select('codigo, nombre').in('codigo', usersIds);
            firmantes = data || [];
        }

        res.json({ 
            success: true, 
            reporte: rep, 
            lineas: lineas || [], 
            periodo: resPer.data,
            catalogoCC: resC.data || [],
            catalogoVar: resV.data || [],
            empleados: empleados,
            firmantes: firmantes
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/recepcionar/:id', async (req, res) => {
    const { codigo_recepcion } = req.body;
    try {
        const { error } = await supabase.from('reportes_enviados')
            .update({ estado: 'Recibido por Planillas', codigo_recepcion: codigo_recepcion })
            .eq('id', req.params.id);
            
        if (error) throw error;
        res.json({ success: true, mensaje: "Reporte marcado como recibido" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// 5. GESTIÓN DE USUARIOS
// ============================================================================

router.get('/usuarios', async (req, res) => {
    try {
        const { data, error } = await supabase.from('usuarios').select('*').order('nombre', { ascending: true });
        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/usuarios/:codigo', async (req, res) => {
    try {
        const { data, error } = await supabase.from('usuarios').select('*').eq('codigo', req.params.codigo).single();
        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/usuarios', async (req, res) => {
    try {
        const { error } = await supabase.from('usuarios').insert([req.body.payload]);
        if (error) throw error;
        res.json({ success: true, mensaje: "Usuario creado" });
    } catch (error) {
        let mensajePersonalizado = "Error interno al procesar el usuario.";
        if (error.code === '23505') {
            if (error.message?.includes('email') || error.details?.includes('email')) {
                mensajePersonalizado = "El correo electrónico ya se encuentra registrado en el sistema.";
            } else {
                mensajePersonalizado = "El código de empleado ya se encuentra asignado a otro usuario.";
            }
        }
        res.status(400).json({ success: false, error: mensajePersonalizado });
    }
});

router.put('/usuarios/:codigo', async (req, res) => {
    try {
        const { error } = await supabase.from('usuarios').update(req.body.payload).eq('codigo', req.params.codigo);
        if (error) throw error;
        res.json({ success: true, mensaje: "Usuario actualizado" });
    } catch (error) {
        let mensajePersonalizado = "Error al actualizar los datos del usuario.";
        if (error.code === '23505') {
            mensajePersonalizado = "El correo electrónico ya está en uso por otro colaborador.";
        }
        res.status(400).json({ success: false, error: mensajePersonalizado });
    }
});

// ============================================================================
// 6. TIEMPOS DE GRACIA (EXCEPCIONES)
// ============================================================================

router.get('/excepciones', async (req, res) => {
    try {
        const { data, error } = await supabase.from('excepciones_periodo')
            .select(`
                *, 
                periodos (codigo_periodo),
                reportante:usuarios!codigo_empleado (nombre, email),
                autorizador:usuarios!codigo_autorizador (nombre, email)
            `)
            .order('id', { ascending: false });
        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/excepciones/:id', async (req, res) => {
    try {
        const { data, error } = await supabase.from('excepciones_periodo')
            .select(`
                *,
                reportante:usuarios!codigo_empleado (nombre, email),
                autorizador:usuarios!codigo_autorizador (nombre, email)
            `)
            .eq('id', req.params.id)
            .single();
        if (error) throw error;

        const { data: per } = await supabase.from('periodos').select('id, codigo_periodo').eq('id', data.id_periodo).single();
        res.json({ success: true, data, periodo: per });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/excepciones', async (req, res) => {
    try {
        const payload = req.body.payload;
        if (!payload.tipo_permiso) {
            payload.tipo_permiso = 'CREAR'; 
        }
        const { error } = await supabase.from('excepciones_periodo').insert([payload]);
        if (error) throw error;
        res.json({ success: true, mensaje: "Excepción creada" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/excepciones/:id', async (req, res) => {
    try {
        const payload = req.body.payload;
        if (!payload.tipo_permiso) {
            payload.tipo_permiso = 'CREAR'; 
        }
        const { error } = await supabase.from('excepciones_periodo').update(payload).eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true, mensaje: "Excepción actualizada" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;