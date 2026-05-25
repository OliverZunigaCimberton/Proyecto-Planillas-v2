// src/components/admin/logica/use_logica_periodos.js
import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../services/api';
import { procesarArchivoExcel } from '../../../utils/cargamasivaperiodo';

export const useLogicaPeriodos = () => {
    // ==========================================
    // 1. ESTADOS
    // ==========================================
    const [view, setView] = useState('LIST');
    const [periodos, setPeriodos] = useState([]);
    const [empleados, setEmpleados] = useState([]);
    const [periodoSeleccionadoObj, setPeriodoSeleccionadoObj] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [notificacion, setNotificacion] = useState({ mensaje: '', tipo: '' });
    const [file, setFile] = useState(null);
    const [showModalVaciar, setShowModalVaciar] = useState(false);
    const [periodoACerrar, setPeriodoACerrar] = useState(null); 

    const [formData, setFormData] = useState({
        id: '', codigo_periodo: '', fecha_desde: '', fecha_hasta: '', fecha_corte: '', hora_corte: '', estado: 'ABIERTO'
    });

    const mostrarToast = (mensaje, tipo = 'success') => {
        setNotificacion({ mensaje, tipo });
        setTimeout(() => setNotificacion({ mensaje: '', tipo: '' }), 3500);
    };

    // ==========================================
    // 2. CARGA INICIAL (HISTORIAL)
    // ==========================================
    const cargarHistorial = useCallback(async () => {
        try {
            const result = await api.admin.getPeriodos();
            setPeriodos(result.data || []);
        } catch (error) {
            console.error("Error cargando historial:", error);
            mostrarToast("Error al cargar el historial", "error");
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => { cargarHistorial(); }, 0);
        return () => clearTimeout(timer);
    }, [cargarHistorial]);

    // ==========================================
    // 3. FLUJOS DE NAVEGACIÓN Y APERTURA
    // ==========================================
    const handleNuevoPeriodo = () => {
        // Validación unificada para detectar si ya existe un periodo abierto
        const activos = periodos.filter(p => p.estado === 'ABIERTO' || p.estado === 'ACTIVO');
        if (activos.length > 0) {
            mostrarToast("Ya existe un periodo ABIERTO o ACTIVO en curso.", "error");
            return;
        }
        setFormData({ id: '', codigo_periodo: '', fecha_desde: '', fecha_hasta: '', fecha_corte: '', hora_corte: '', estado: 'ABIERTO' });
        setFile(null); 
        setView('FORM');
    };

    const handleEditarPeriodo = async (id) => {
        try {
            const result = await api.admin.getPeriodoById(id);
            if (result.data) {
                const p = result.data;
                setFormData({
                    id: p.id,
                    codigo_periodo: p.codigo_periodo,
                    fecha_desde: p.fecha_desde ? p.fecha_desde.split('T')[0] : '',
                    fecha_hasta: p.fecha_hasta ? p.fecha_hasta.split('T')[0] : '',
                    fecha_corte: p.fecha_corte ? p.fecha_corte.split('T')[0] : '',
                    hora_corte: p.hora_corte ? p.hora_corte.substring(0, 5) : '',
                    estado: p.estado
                });
                setFile(null);
                setView('FORM');
            }
        } catch (error) {
            console.error("Error al abrir edición:", error);
            mostrarToast("Error al abrir edición", "error");
        }
    };

    const handleGestionarPersonal = async (periodoObj) => {
        setPeriodoSeleccionadoObj(periodoObj);
        setIsLoading(true);
        try {
            const res = await api.admin.getEmpleadosByPeriodo(periodoObj.id);
            setEmpleados(res.data || []);
            setView('PERSONNEL');
        } catch (error) {
            console.error("Error al cargar empleados:", error);
            mostrarToast("Error al cargar los empleados del periodo", "error");
        } finally {
            setIsLoading(false);
        }
    };

    // ==========================================
    // 4. GUARDADO DE PERIODO (NUEVO O EDICIÓN)
    // ==========================================
    const handleGuardar = async () => {
        if (!formData.fecha_desde || !formData.fecha_hasta || !formData.fecha_corte || !formData.hora_corte) {
            mostrarToast("Complete todos los campos obligatorios", "error");
            return;
        }

        setIsLoading(true);
        const nombresMeses = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
        const fechaRef = new Date(formData.fecha_desde + "T00:00:00");

        const payload = {
            codigo_periodo: parseInt(formData.codigo_periodo, 10),
            fecha_desde: formData.fecha_desde,
            fecha_hasta: formData.fecha_hasta,
            fecha_corte: formData.fecha_corte,
            hora_corte: formData.hora_corte.length <= 5 ? formData.hora_corte + ":00" : formData.hora_corte,
            estado: formData.estado || 'ABIERTO',
            mes: nombresMeses[fechaRef.getMonth()],
            anio: fechaRef.getFullYear()
        };

        try {
            if (formData.id) {
                const res = await api.admin.actualizarPeriodo(formData.id, payload);
                if (res.error) throw new Error(res.error);
                mostrarToast("Parámetros actualizados con éxito", "success");
            } else {
                if (!file) throw new Error("Debe subir el archivo de empleados (.xlsx) para iniciar el periodo");
                const empleadosCargados = await procesarArchivoExcel(file);
                
                const res = await api.admin.guardarPeriodo({ 
                    periodoPayload: payload, 
                    empleadosPayload: empleadosCargados 
                });
                if (res.error) throw new Error(res.error);
                mostrarToast("Nuevo periodo y personal maestro creados con éxito", "success");
            }
            setView('LIST');
            cargarHistorial();
        } catch (error) {
            console.error("Error al guardar periodo:", error);
            mostrarToast(error.message || "Error al procesar", "error");
        } finally { 
            setIsLoading(false); 
        }
    };

    const confirmarCierrePeriodo = async () => {
        setIsLoading(true);
        try {
            const res = await api.admin.actualizarPeriodo(periodoACerrar.id, { estado: 'CERRADO' });
            if (res.error) throw new Error(res.error);
            mostrarToast("Periodo cerrado y sellado exitosamente.", "success");
            cargarHistorial();
            setPeriodoACerrar(null);
        } catch (error) {
            console.error("Error al cerrar periodo:", error);
            mostrarToast(error.message || "Error crítico al cerrar el periodo", "error");
        } finally {
            setIsLoading(false);
        }
    };

    // ==========================================
    // 5. MANTENIMIENTO DEL PERSONAL EN LA QUINCENA
    // ==========================================
    const handleCargaMasivaPersonal = async (e) => {
        const targetFile = e.target.files[0];
        if (!targetFile) return;
        setIsLoading(true);
        try {
            const nuevosEmpleados = await procesarArchivoExcel(targetFile);
            const res = await api.admin.actualizarPeriodo(periodoSeleccionadoObj.id, {
                ...periodoSeleccionadoObj,
                empleadosPayload: nuevosEmpleados
            });
            if (res.error) throw new Error(res.error);
            mostrarToast("Nueva carga masiva procesada con éxito", "success");
            handleGestionarPersonal(periodoSeleccionadoObj);
        } catch (error) {
            console.error("Error en carga masiva:", error);
            mostrarToast(error.message || "Error al recargar personal.", "error");
        } finally { setIsLoading(false); e.target.value = ''; }
    };

    const handleVaciarPersonal = async () => {
        setIsLoading(true);
        try {
            const res = await api.admin.eliminarPersonalPeriodo(periodoSeleccionadoObj.id);
            if (res.error) throw new Error(res.error);
            mostrarToast("Base de empleados vaciada con éxito", "success");
            handleGestionarPersonal(periodoSeleccionadoObj);
        } catch (error) { 
            console.error("Error al vaciar personal:", error);
            mostrarToast(error.message || "Error al vaciar personal.", "error"); 
        } finally { setIsLoading(false); }
    };

    const handleContainerManualSubmit = async (empleadoData, callbackExito) => {
        setIsLoading(true);
        try {
            const res = await api.admin.agregarEmpleadoManual({ 
                ...empleadoData, 
                id_periodo: periodoSeleccionadoObj.id 
            });
            if (res.error || res.success === false) throw new Error(res.error || "Error de servidor");
            
            mostrarToast("Empleado incorporado exitosamente", "success");
            callbackExito();
            const refreshRes = await api.admin.getEmpleadosByPeriodo(periodoSeleccionadoObj.id);
            setEmpleados(refreshRes.data || []);
        } catch (error) {
            console.error("Error al agregar empleado manual:", error);
            mostrarToast(error.message || "Error al agregar empleado.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEliminarEmpleadoManual = async (codigoEmpleado) => {
        setIsLoading(true);
        try {
            const res = await api.admin.eliminarEmpleadoManual(periodoSeleccionadoObj.id, codigoEmpleado);
            if (res.error) throw new Error(res.error);
            mostrarToast("Registro eliminado del maestro", "success");
            handleGestionarPersonal(periodoSeleccionadoObj);
        } catch (error) { 
            console.error("Error al eliminar empleado:", error);
            mostrarToast(error.message || "Error al remover empleado.", "error"); 
        } finally { setIsLoading(false); }
    };

    const isPeriodoBloqueado = periodoSeleccionadoObj?.estado === 'CERRADO' || periodoSeleccionadoObj?.estado === 'INACTIVO';

    return {
        view, setView,
        periodos,
        empleados,
        periodoSeleccionadoObj,
        isLoading,
        notificacion,
        file, setFile,
        showModalVaciar, setShowModalVaciar,
        periodoACerrar, setPeriodoACerrar,
        formData, setFormData,
        isPeriodoBloqueado,
        handleNuevoPeriodo,
        handleEditarPeriodo,
        handleGestionarPersonal,
        handleGuardar,
        confirmarCierrePeriodo,
        handleCargaMasivaPersonal,
        handleVaciarPersonal,
        handleContainerManualSubmit,
        handleEliminarEmpleadoManual
    };
};