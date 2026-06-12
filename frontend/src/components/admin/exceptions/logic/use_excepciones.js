// exceptions/logic/use_excepciones.js
import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../../services/api';
import { extraerFechaParaInput, formatearHoraParaServidor } from '../../../../utils/dateValidation';

export const useExcepciones = () => {
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

    const mostrarToast = useCallback((mensaje, tipo = 'success') => {
        setNotificacion({ mensaje, tipo });
        setTimeout(() => setNotificacion({ mensaje: '', tipo: '' }), 3500);
    }, []);

    // Descarga unificada de excepciones operativas y el periodo activo
    const cargarDatos = useCallback(async () => {
        try {
            setIsLoading(true);
            
            const [resPeriodo, resExcepciones] = await Promise.all([
                api.shared.getPeriodoActivo(),
                api.admin.getExcepciones()
            ]);

            if (resPeriodo?.data) {
                setPeriodoActivo(resPeriodo.data);
            }

            const dataRaw = resExcepciones?.data;
            const finalExcepciones = dataRaw?.data || dataRaw || (Array.isArray(resExcepciones) ? resExcepciones : []);
            setExcepciones(finalExcepciones);
        } catch (error) {
            console.error("Error cargando el submundo de excepciones:", error);
            mostrarToast("Error al recuperar listados del servidor", "error");
        } finally {
            setIsLoading(false);
        }
    }, [mostrarToast]);

    useEffect(() => {
        let activo = true;
        queueMicrotask(() => {
            if (activo) {
                cargarDatos();
            }
        });
        return () => { activo = false; };
    }, [cargarDatos]);

    // Consulta en tiempo real de los datos catastrales del reportante
    const handleReportanteBlur = async () => {
        const codigo = formData.codigo_empleado?.trim();
        if (!codigo) {
            setInfoReportante(null);
            return;
        }

        try {
            const res = await api.admin.getUsuarioById(parseInt(codigo, 10));
            const u = res?.data?.data || res?.data || res;
            if (u && u.nombre) {
                setInfoReportante(u);
            } else {
                setInfoReportante({ nombre: 'EMPLEADO NO ENCONTRADO O INACTIVO' });
            }
        } catch (error) {
            console.error("Error al verificar reportante:", error);
            setInfoReportante({ nombre: 'ERROR AL VERIFICAR CÓDIGO' });
        }
    };

    // Consulta en tiempo real de los datos catastrales del autorizador
    const handleAutorizadorBlur = async () => {
        const codigo = formData.codigo_autorizador?.trim();
        if (!codigo) {
            setInfoAutorizador(null);
            return;
        }

        try {
            const res = await api.admin.getUsuarioById(parseInt(codigo, 10));
            const u = res?.data?.data || res?.data || res;
            if (u && u.nombre) {
                setInfoAutorizador(u);
            } else {
                setInfoAutorizador({ nombre: 'AUTORIZADOR NO ENCONTRADO O INACTIVO' });
            }
        } catch (error) {
            console.error("Error al verificar autorizador:", error);
            setInfoAutorizador({ nombre: 'ERROR AL VERIFICAR CÓDIGO' });
        }
    };

    const handleNuevaExcepcion = (tipo = 'CREAR') => {
        if (!periodoActivo) {
            mostrarToast("No existe un período activo en este momento", "error");
            return;
        }
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
            tipo_permiso: tipo
        });
        setView('FORM');
    };

    const handleEditarExcepcion = (exc) => {
        if (!exc) return;
        setInfoReportante({ nombre: exc.usuarios_empleado?.nombre || 'Cargado' });
        setInfoAutorizador({ nombre: exc.usuarios_autorizador?.nombre || 'Cargado' });
        
        setFormData({
            id: exc.id,
            id_periodo: exc.id_periodo,
            codigo_empleado: exc.codigo_empleado ? String(exc.codigo_empleado) : '',
            codigo_autorizador: exc.codigo_autorizador ? String(exc.codigo_autorizador) : '',
            nueva_fecha_corte: extraerFechaParaInput(exc.nueva_fecha_corte),
            nueva_hora_corte: exc.nueva_hora_corte ? exc.nueva_hora_corte.substring(0, 5) : '',
            motivo: exc.motivo || '',
            tipo_permiso: exc.tipo_permiso || 'CREAR'
        });
        setView('FORM');
    };

    // ============================================================================
    // PROCESAMIENTO COMPORTAMENTAL CON CORRECCIÓN DE CANDADOS
    // ============================================================================
    const handleGuardar = async () => {
        const tipo = formData.tipo_permiso || 'CREAR';

        // 🔄 REGLA DE NEGOCIO CORREGIDA: Ajustamos las condiciones por tipo de flujo
        if (tipo === 'CREAR' && !formData.codigo_empleado) {
            mostrarToast("El código del empleado es requerido", "error");
            return;
        }
        
        if (tipo === 'AUTORIZAR' && !formData.codigo_autorizador) {
            mostrarToast("El código del autorizador es requerido para habilitar firmas fuera de tiempo", "error");
            return;
        }

        if (!formData.nueva_fecha_corte || !formData.nueva_hora_corte) {
            mostrarToast("Establece la fecha y hora límite de la prórroga", "error");
            return;
        }

        setIsLoading(true);

        const payload = {
            id_periodo: parseInt(formData.id_periodo, 10),
            // Si es AUTORIZAR, mandamos null al empleado de forma limpia, evitando basura relacional
            codigo_empleado: tipo === 'CREAR' ? parseInt(formData.codigo_empleado, 10) : null,
            codigo_autorizador: formData.codigo_autorizador ? parseInt(formData.codigo_autorizador, 10) : null,
            nueva_fecha_corte: formData.nueva_fecha_corte,
            nueva_hora_corte: formatearHoraParaServidor(formData.nueva_hora_corte),
            motivo: formData.motivo ? formData.motivo.trim() : '',
            tipo_permiso: tipo 
        };

        try {
            if (formData.id) {
                await api.admin.actualizarExcepcion(formData.id, { payload });
                mostrarToast("Tiempo de Gracia actualizado con éxito", "success");
            } else {
                await api.admin.guardarExcepcion({ payload });
                mostrarToast("Tiempo de Gracia guardado con éxito", "success");
            }
            setView('LIST');
            cargarDatos();
        } catch (error) {
            console.error("Error procesando persistencia de excepción:", error);
            mostrarToast("Error al procesar la excepción en el servidor", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return {
        view,
        setView,
        excepciones,
        periodoActivo,
        isLoading,
        notificacion,
        infoReportante,
        infoAutorizador,
        formData,
        setFormData,
        handleReportanteBlur,
        handleAutorizadorBlur,
        handleNuevaExcepcion,
        handleEditarExcepcion,
        handleGuardar
    };
};