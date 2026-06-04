import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../../services/api';
import { procesarArchivoExcel } from '../../../../utils/cargamasivaperiodo';
import { extraerFechaParaInput, formatearHoraParaServidor, calcularMesYAnioPeriodo } from '../../../../utils/dateValidation';

export const usePeriodos = () => {
    const [view, setView] = useState('LIST'); // 'LIST' | 'FORM' | 'PERSONNEL'
    const [periodos, setPeriodos] = useState([]);
    const [empleados, setEmpleados] = useState([]);
    const [periodoSeleccionadoObj, setPeriodoSeleccionadoObj] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [notificacion, setNotificacion] = useState({ mensaje: '', tipo: '' });
    const [file, setFile] = useState(null);
    const [showModalVaciar, setShowModalVaciar] = useState(false);
    const [periodoACerrar, setPeriodoACerrar] = useState(null); 

    const [formData, setFormData] = useState({
        id: '', 
        codigo_periodo: '', 
        fecha_desde: '', 
        fecha_hasta: '', 
        fecha_corte: '', 
        hora_corte: '', 
        estado: 'ABIERTO'
    });

    const mostrarToast = useCallback((mensaje, tipo = 'success') => {
        setNotificacion({ mensaje, tipo });
        setTimeout(() => setNotificacion({ mensaje: '', tipo: '' }), 3500);
    }, []);

    // Consulta del historial de quincenas registradas en la base de datos
    const cargarHistorial = useCallback(async () => {
        try {
            setIsLoading(true);
            const result = await api.admin.getPeriodos();
            setPeriodos(result.data || []);
        } catch (error) {
            console.error("Error cargando historial de periodos:", error);
            mostrarToast("Error al cargar el historial de quincenas", "error");
        } finally {
            setIsLoading(false);
        }
    }, [mostrarToast]);

    // Inicialización asíncrona segura en el hilo secundario de renderizado
    useEffect(() => {
        let activo = true;

        queueMicrotask(() => {
            if (activo) {
                cargarHistorial();
            }
        });

        return () => {
            activo = false;
        };
    }, [cargarHistorial]);

    const handleNuevoPeriodo = () => {
        const activos = periodos.filter(p => p.estado === 'ABIERTO' || p.estado === 'ACTIVO');
        if (activos.length > 0) {
            mostrarToast("Ya existe un periodo ABIERTO o ACTIVO en curso. Debe cerrarlo primero.", "error");
            return;
        }
        setFormData({ id: '', codigo_periodo: '', fecha_desde: '', fecha_hasta: '', fecha_corte: '', hora_corte: '', estado: 'ABIERTO' });
        setFile(null); 
        setView('FORM');
    };

    const handleEditarPeriodo = async (id) => {
        try {
            setIsLoading(true);
            const result = await api.admin.getPeriodoById(id);
            if (result.data) {
                const p = result.data;
                setFormData({
                    id: p.id,
                    codigo_periodo: p.codigo_periodo,
                    fecha_desde: extraerFechaParaInput(p.fecha_desde),
                    fecha_hasta: extraerFechaParaInput(p.fecha_hasta),
                    fecha_corte: extraerFechaParaInput(p.fecha_corte),
                    hora_corte: p.hora_corte ? p.hora_corte.substring(0, 5) : '',
                    estado: p.estado
                });
                setFile(null);
                setView('FORM');
            }
        } catch (error) {
            console.error("Error al recuperar periodo por ID:", error);
            mostrarToast("Error al cargar los parámetros del periodo", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGestionarPersonal = async (periodoObj) => {
        if (!periodoObj) return;
        setPeriodoSeleccionadoObj(periodoObj);
        setIsLoading(true);
        try {
            const res = await api.admin.getEmpleadosByPeriodo(periodoObj.id);
            setEmpleados(res.data || []);
            setView('PERSONNEL');
        } catch (error) {
            console.error("Error al cargar nómina del periodo:", error);
            mostrarToast("Error al cargar los empleados vinculados", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGuardar = async () => {
        if (!formData.fecha_desde || !formData.fecha_hasta || !formData.fecha_corte || !formData.hora_corte) {
            mostrarToast("Complete todos los campos obligatorios del formulario", "error");
            return;
        }

        setIsLoading(true);
        
        // Invocación del motor del tiempo centralizado para deducir el mes contable y año fiscal
        const { mes, anio } = calcularMesYAnioPeriodo(formData.fecha_desde);

        const payload = {
            codigo_periodo: parseInt(formData.codigo_periodo, 10),
            fecha_desde: formData.fecha_desde,
            fecha_hasta: formData.fecha_hasta,
            fecha_corte: formData.fecha_corte,
            hora_corte: formatearHoraParaServidor(formData.hora_corte),
            estado: formData.estado || 'ABIERTO',
            mes: mes,
            anio: anio
        };

        try {
            if (formData.id) {
                const res = await api.admin.actualizarPeriodo(formData.id, payload);
                if (res.error) throw new Error(res.error);
                mostrarToast("Parámetros de quincena actualizados con éxito", "success");
            } else {
                if (!file) throw new Error("Debe seleccionar el archivo maestro de empleados (.xlsx) para iniciar el periodo");
                const empleadosCargados = await procesarArchivoExcel(file);
                
                const res = await api.admin.guardarPeriodo({ 
                    periodoPayload: payload, 
                    empleadosPayload: empleadosCargados 
                });
                if (res.error) throw new Error(res.error);
                mostrarToast("Nuevo periodo contable e ingesta de personal creados con éxito", "success");
            }
            setView('LIST');
            cargarHistorial();
        } catch (error) {
            console.error("Error procesando persistencia de periodo:", error);
            mostrarToast(error.message || "Error al procesar la solicitud en el servidor", "error");
        } finally { 
            setIsLoading(false); 
        }
    };

    const confirmarCierrePeriodo = async () => {
        if (!periodoACerrar) return;
        setIsLoading(true);
        try {
            const res = await api.admin.actualizarPeriodo(periodoACerrar.id, { estado: 'CERRADO' });
            if (res.error) throw new Error(res.error);
            mostrarToast("Periodo sellado y cerrado de forma definitiva exitosamente.", "success");
            cargarHistorial();
            setPeriodoACerrar(null);
        } catch (error) {
            console.error("Error al ejecutar cierre definitivo de periodo:", error);
            mostrarToast(error.message || "Error crítico al intentar sellar la quincena", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCargaMasivaPersonal = async (e) => {
        const targetFile = e.target.files[0];
        if (!targetFile || !periodoSeleccionadoObj) return;
        setIsLoading(true);
        try {
            const nuevosEmpleados = await procesarArchivoExcel(targetFile);
            const res = await api.admin.actualizarPeriodo(periodoSeleccionadoObj.id, {
                ...periodoSeleccionadoObj,
                empleadosPayload: nuevosEmpleados
            });
            if (res.error) throw new Error(res.error);
            mostrarToast("Carga masiva y reemplazo de personal procesados con éxito", "success");
            handleGestionarPersonal(periodoSeleccionadoObj);
        } catch (error) {
            console.error("Error ejecutando sobreescritura de personal por Excel:", error);
            mostrarToast(error.message || "Error al recargar base de datos de personal.", "error");
        } finally { 
            setIsLoading(false); 
            e.target.value = ''; 
        }
    };

    const handleVaciarPersonal = async () => {
        if (!periodoSeleccionadoObj) return;
        setIsLoading(true);
        try {
            const res = await api.admin.eliminarPersonalPeriodo(periodoSeleccionadoObj.id);
            if (res.error) throw new Error(res.error);
            mostrarToast("Base de colaboradores del periodo eliminada con éxito", "success");
            handleGestionarPersonal(periodoSeleccionadoObj);
        } catch (error) { 
            console.error("Error ejecutando borrado maestro de personal:", error);
            mostrarToast(error.message || "Error al vaciar la lista de personal.", "error"); 
        } finally { 
            setIsLoading(false); 
        }
    };

    const handleContainerManualSubmit = async (empleadoData, callbackExito) => {
        if (!periodoSeleccionadoObj) return;
        setIsLoading(true);
        try {
            const res = await api.admin.agregarEmpleadoManual({ 
                ...empleadoData, 
                id_periodo: periodoSeleccionadoObj.id 
            });
            if (res.error || res.success === false) throw new Error(res.error || "Error interno del servidor");
            
            mostrarToast("Colaborador incorporado exitosamente", "success");
            callbackExito();
            const refreshRes = await api.admin.getEmpleadosByPeriodo(periodoSeleccionadoObj.id);
            setEmpleados(refreshRes.data || []);
        } catch (error) {
            console.error("Error incorporando empleado manual:", error);
            mostrarToast(error.message || "Error al agregar colaborador a la lista.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEliminarEmpleadoManual = async (codigoEmpleado) => {
        if (!periodoSeleccionadoObj) return;
        setIsLoading(true);
        try {
            const res = await api.admin.eliminarEmpleadoManual(periodoSeleccionadoObj.id, codigoEmpleado);
            if (res.error) throw new Error(res.error);
            mostrarToast("Registro eliminado con éxito de la quincena", "success");
            handleGestionarPersonal(periodoSeleccionadoObj);
        } catch (error) { 
            console.error("Error al remover empleado individual:", error);
            mostrarToast(error.message || "Error al desvincular colaborador.", "error"); 
        } finally { 
            setIsLoading(false); 
        }
    };

    const isPeriodoBloqueado = periodoSeleccionadoObj?.estado === 'CERRADO' || periodoSeleccionadoObj?.estado === 'INACTIVO';

    return {
        view,
        setView,
        periodos,
        empleados,
        periodoSeleccionadoObj,
        isLoading,
        notificacion,
        file,
        setFile,
        showModalVaciar,
        setShowModalVaciar,
        periodoACerrar,
        setPeriodoACerrar,
        formData,
        setFormData,
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