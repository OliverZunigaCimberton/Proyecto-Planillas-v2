// src/components/reportes/logica/use_api_reporte.js
import { useState, useCallback } from 'react';
import { api } from '../../../../services/api'; 

export const useApiReporte = (user) => {
    const [isLoading, setIsLoading] = useState(false);

    // --- Funciones Auxiliares ---
    const toBase64 = file => new Promise((res, rej) => {
        const r = new FileReader(); r.readAsDataURL(file);
        r.onload = () => res(r.result.split(',')[1]); 
        r.onerror = e => rej(e);
    });

    // --- 1. Cargar Detalles del Reporte usando el Mensajero Oficial ---
    const cargarDetallesAPI = useCallback(async (idReporte, modoVista) => {
        setIsLoading(true);
        try {
            let result;
            // Llamamos al método correcto del API unificado según el rol de la vista
            if (modoVista === 'CONTADOR') {
                result = await api.contador.getReporteById(idReporte);
            } else if (modoVista === 'JUEZ') {
                result = await api.autorizador.getReporteById(idReporte);
            } else if (modoVista === 'ADMIN') {
                result = await api.admin.getReporteById(idReporte);
            } else {
                result = await api.reportante.getReporteById(idReporte);
            }
            return result; 
        } catch (error) {
            console.error("Error al cargar reporte:", error);
            return { success: false, error };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // --- 2. Guardar Flujo Completo ---
    const guardarFlujoAPI = useCallback(async ({ 
        estadoDeseado, autorizadorId, reporteHeader, lineas, 
        totalGeneral, targetPeriodoId, adjuntosExistentes, archivosParaSubir 
    }) => {
        setIsLoading(true);
        try {
            const nuevasUrls = [];
            for (const f of archivosParaSubir) {
                const b64 = await toBase64(f);
                const resUp = await api.reportante.uploadArchivo({ fileName: f.name, fileType: f.type, fileBase64: b64 });
                if (resUp.success) nuevasUrls.push({ nombre: resUp.nombre, url: resUp.url });
            }

            const hoy = new Date();
            const fechaLocalStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

            const result = await api.reportante.guardarReporte({
                reporte: { 
                    id_periodo: parseInt(targetPeriodoId), 
                    codigo_usuario: parseInt(user.codigo), 
                    marca: reporteHeader.marca, 
                    monto_total: totalGeneral, 
                    estado: estadoDeseado, 
                    fecha_envio: new Date().toISOString(), 
                    codigo_autorizador: autorizadorId ? parseInt(autorizadorId) : null, 
                    adjuntos: [...adjuntosExistentes, ...nuevasUrls] 
                },
                lineas: lineas.filter(l => l.codigo_empleado && l.id_variable).map(l => ({ 
                    id_periodo: parseInt(targetPeriodoId), 
                    codigo_empleado: parseInt(l.codigo_empleado), 
                    id_variable: parseInt(l.id_variable), 
                    id_marca: parseInt(reporteHeader.id_marca), 
                    id_cc: parseInt(reporteHeader.id_cc), 
                    cargo_a_marca: reporteHeader.cargo_a_marca, 
                    monto: parseFloat(String(l.monto).replace(/[^0-9.-]+/g, '')),
                    fecha_registro: fechaLocalStr 
                })),
                idReporteEdicion: reporteHeader.id
            });
            
            if (result?.success === false) throw new Error(result.error);

            return { success: true };
        } catch (error) { 
            return { success: false, error: error.message }; 
        } finally { 
            setIsLoading(false); 
        }
    }, [user]);

    // --- 3. Acciones de Flujo Específicas usando el Mensajero Oficial ---
    const cancelarEnvioAPI = useCallback(async (id) => {
        setIsLoading(true);
        try {
            const result = await api.reportante.cancelarEnvio(id);
            if (!result.success) throw new Error(result.error || "Error al cancelar el envío");
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    const eliminarBorradorAPI = useCallback(async (id) => {
        setIsLoading(true);
        try {
            const result = await api.reportante.eliminarBorrador(id);
            if (!result.success) throw new Error(result.error || "Error al eliminar el borrador");
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    const accionJuezAPI = useCallback(async (id, accion) => {
        setIsLoading(true);
        try {
            const payload = accion === 'APROBAR' 
                ? { estado: 'Autorizado y Enviado a Contabilidad', codigo_autorizador: parseInt(user.codigo) } 
                : { estado: 'Denegado' };
            const result = await api.autorizador.actualizarEstado(id, payload);
            if (!result.success) throw new Error(result.error || "Error en la acción del autorizador");
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    const accionContadorAPI = useCallback(async (id) => {
        setIsLoading(true);
        try {
            const result = await api.contador.contabilizar(id, { codigo_contador: parseInt(user.codigo) });
            if (!result.success) throw new Error(result.error || "Error al contabilizar el reporte");
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    const accionAdminAPI = useCallback(async (id) => {
        setIsLoading(true);
        try {
            const result = await api.admin.recepcionar(id, { codigo_recepcion: parseInt(user.codigo), estado: 'Recibido por Planillas' });
            if (!result.success) throw new Error(result.error || "Error al recepcionar el reporte");
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // --- 4. Búsqueda de Autorizador y Empleado ---
    const buscarAutorizadorAPI = useCallback(async (codigo) => {
        try {
            const res = await api.reportante.getAutorizadorByCodigo(codigo);
            return res.data || null;
        } catch (error) {
            console.error(error);
            return null;
        }
    }, []);

    const buscarEmpleadoRowAPI = useCallback(async (codigo, idPeriodo) => {
        try {
            const res = await api.reportante.verificarEmpleados([codigo], idPeriodo);
            return (res.data && res.data.length > 0) ? res.data[0] : null;
        } catch (error) {
            console.error(error);
            return null;
        }
    }, []);

    return { 
        isLoading,
        cargarDetallesAPI,
        guardarFlujoAPI, 
        cancelarEnvioAPI, 
        eliminarBorradorAPI, 
        accionJuezAPI, 
        accionContadorAPI, 
        accionAdminAPI,
        buscarAutorizadorAPI,
        buscarEmpleadoRowAPI
    };
};