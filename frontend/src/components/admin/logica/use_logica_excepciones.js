// src/components/admin/logica/use_logica_excepciones.js
import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../services/api';

export const useLogicaExcepciones = () => {
    // ==========================================
    // 1. ESTADOS
    // ==========================================
    const [view, setView] = useState('LIST'); // 'LIST' | 'FORM'
    const [excepciones, setExcepciones] = useState([]);
    const [periodoActivo, setPeriodoActivo] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [notificacion, setNotificacion] = useState({ mensaje: '', tipo: '' });

    const [infoReportante, setInfoReportante] = useState(null);
    const [infoAutorizador, setInfoAutorizador] = useState(null);

    const [formData, setFormData] = useState({
        id: '', 
        id_periodo: '', 
        codigo_empleado: '', 
        codigo_autorizador: '', 
        nueva_fecha_corte: '', 
        nueva_hora_corte: '', 
        motivo: '',
        tipo_permiso: 'CREAR' 
    });

    const mostrarToast = (mensaje, tipo = 'success') => {
        setNotificacion({ mensaje, tipo });
        setTimeout(() => setNotificacion({ mensaje: '', tipo: '' }), 3500);
    };

    // ==========================================
    // 2. LLAMADAS A LA API Y CARGA INICIAL
    // ==========================================
    const cargarDatos = useCallback(async () => {
        try {
            setIsLoading(true);
            const resultExc = await api.admin.getExcepciones();
            const dataRaw = resultExc?.data;
            const finalExcepciones = (dataRaw && dataRaw.data && Array.isArray(dataRaw.data))
                ? dataRaw.data
                : (Array.isArray(dataRaw) ? dataRaw : (Array.isArray(resultExc) ? resultExc : []));
            setExcepciones(finalExcepciones);

            const resultPer = await api.admin.getPeriodos();
            const dataPeriodosRaw = resultPer?.data;
            const listaPeriodos = (dataPeriodosRaw && dataPeriodosRaw.data && Array.isArray(dataPeriodosRaw.data))
                ? dataPeriodosRaw.data
                : (Array.isArray(dataPeriodosRaw) ? dataPeriodosRaw : (Array.isArray(resultPer) ? resultPer : []));

            const activo = listaPeriodos.find(p => p.estado === 'ACTIVO' || p.estado === 'ABIERTO');
            setPeriodoActivo(activo || null);
        } catch (error) {
            console.error("Error al cargar datos de excepciones:", error);
            mostrarToast("Error al cargar datos", "error");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => { cargarDatos(); }, 0);
        return () => clearTimeout(timer);
    }, [cargarDatos]);

    // ==========================================
    // 3. MANEJADORES DE INTERFAZ (BLUR)
    // ==========================================
    const handleReportanteBlur = async (codigo) => {
        const cleanCode = String(codigo).trim();
        if (!cleanCode) { setInfoReportante(null); return; }
        try {
            const res = await api.admin.getUsuarioById(cleanCode);
            const user = res?.data?.data || res?.data || res;
            if (user && user.nombre) setInfoReportante({ nombre: user.nombre, email: user.email });
            else setInfoReportante({ nombre: 'USUARIO NO ENCONTRADO', email: '-' });
        } catch (error) {
            console.error("Error consultando reportante:", error);
            setInfoReportante({ nombre: 'ERROR AL CONSULTAR', email: '-' });
        }
    };

    const handleAutorizadorBlur = async (codigo) => {
        const cleanCode = String(codigo).trim();
        if (!cleanCode) { setInfoAutorizador(null); return; }
        try {
            const res = await api.admin.getUsuarioById(cleanCode);
            const user = res?.data?.data || res?.data || res;
            if (user && user.nombre) setInfoAutorizador({ nombre: user.nombre, email: user.email });
            else setInfoAutorizador({ nombre: 'AUTORIZADOR NO ENCONTRADO', email: '-' });
        } catch (error) {
            console.error("Error consultando autorizador:", error);
            setInfoAutorizador({ nombre: 'ERROR AL CONSULTAR', email: '-' });
        }
    };

    // ==========================================
    // 4. FLUJO DE TRABAJO (NUEVO, EDITAR, GUARDAR)
    // ==========================================
    const handleNuevaExcepcion = () => {
        if (!periodoActivo) {
            mostrarToast("No hay un periodo activo en el sistema.", "error");
            return;
        }

        // ✨ 1. REGLA: Bloqueo si el periodo está cerrado
        const estado = periodoActivo.estado?.toString().trim().toUpperCase();
        if (estado === 'CERRADO' || estado === 'INACTIVO') {
            mostrarToast("El periodo está cerrado. No puedes dar tiempos de gracia.", "error");
            return;
        }

        // ✨ 2. REGLA: Bloqueo con alerta visual si el tiempo global aún no termina
        if (periodoActivo.fecha_corte && periodoActivo.hora_corte) {
            const finGlobal = new Date(`${periodoActivo.fecha_corte.split('T')[0]}T${periodoActivo.hora_corte}`).getTime();
            const ahora = new Date().getTime();
            
            if (ahora <= finGlobal) {
                mostrarToast("Aún no finaliza el corte de variables global.", "error");
                return;
            }
        }

        // Si pasa las reglas, se abre el formulario
        setInfoReportante(null);
        setInfoAutorizador(null);
        setFormData({
            id: '', 
            id_periodo: periodoActivo.id, 
            codigo_empleado: '', 
            codigo_autorizador: '', 
            nueva_fecha_corte: '', 
            nueva_hora_corte: '', 
            motivo: '',
            tipo_permiso: 'CREAR'
        });
        setView('FORM');
    };

    const handleEditarExcepcion = async (id) => {
        try {
            setIsLoading(true);
            const result = await api.admin.getExcepcionById(id);
            const exc = result?.data?.data || result?.data || result;
            
            if (exc) {
                setFormData({
                    id: exc.id,
                    id_periodo: exc.id_periodo,
                    codigo_empleado: exc.codigo_empleado ?? '',
                    codigo_autorizador: exc.codigo_autorizador ?? '',
                    nueva_fecha_corte: exc.nueva_fecha_corte ? exc.nueva_fecha_corte.split('T')[0] : '',
                    nueva_hora_corte: exc.nueva_hora_corte ? exc.nueva_hora_corte.substring(0, 5) : '',
                    motivo: exc.motivo || '',
                    tipo_permiso: exc.tipo_permiso || 'CREAR' 
                });

                if (exc.codigo_empleado) handleReportanteBlur(exc.codigo_empleado);
                if (exc.codigo_autorizador) handleAutorizadorBlur(exc.codigo_autorizador);

                setView('FORM');
            }
        } catch (error) {
            console.error("Error al editar excepción:", error);
            mostrarToast("Error al cargar la excepción", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGuardar = async () => {
        // ✨ VALIDACIÓN INTELIGENTE (Soluciona el error que tenías)
        if (!formData.id_periodo || !formData.nueva_fecha_corte || !formData.nueva_hora_corte) {
            mostrarToast("Completa la fecha y hora de corte", "error");
            return;
        }

        const tipo = formData.tipo_permiso || 'CREAR';

        if (tipo === 'CREAR' && !formData.codigo_empleado) {
            mostrarToast("El código del Reportante es obligatorio", "error");
            return;
        }

        if (tipo === 'AUTORIZAR' && !formData.codigo_autorizador) {
            mostrarToast("El código del Autorizador es obligatorio", "error");
            return;
        }

        setIsLoading(true);
        
        // Protegemos el payload: Si viene vacío, lo mandamos como 'null' para que la DB no falle
        const payload = {
            id_periodo: parseInt(formData.id_periodo, 10),
            codigo_empleado: formData.codigo_empleado ? parseInt(formData.codigo_empleado, 10) : null,
            codigo_autorizador: formData.codigo_autorizador ? parseInt(formData.codigo_autorizador, 10) : null,
            nueva_fecha_corte: formData.nueva_fecha_corte,
            nueva_hora_corte: formData.nueva_hora_corte.substring(0, 5) + ":00",
            motivo: formData.motivo ? formData.motivo.trim() : '',
            tipo_permiso: tipo 
        };

        try {
            if (formData.id) {
                await api.admin.actualizarExcepcion(formData.id, { payload });
                mostrarToast("Tiempo de Gracia actualizado", "success");
            } else {
                await api.admin.guardarExcepcion({ payload });
                mostrarToast("Tiempo de Gracia guardado", "success");
            }
            setView('LIST');
            cargarDatos();
        } catch (error) {
            console.error("Error al guardar excepción:", error);
            mostrarToast("Error al procesar la excepción", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return {
        view, setView,
        excepciones,
        periodoActivo,
        isLoading,
        notificacion,
        infoReportante,
        infoAutorizador,
        formData, setFormData,
        handleReportanteBlur,
        handleAutorizadorBlur,
        handleNuevaExcepcion,
        handleEditarExcepcion,
        handleGuardar
    };
};