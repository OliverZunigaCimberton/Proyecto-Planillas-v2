// src/components/reportes/logica/use_api_reporte.js
import { useState, useCallback } from 'react';
import { api } from '../../../services/api'; 

export const useApiReporte = (user) => {
    const [isLoading, setIsLoading] = useState(false);

    // --- Funciones Auxiliares ---
    const toBase64 = file => new Promise((res, rej) => {
        const r = new FileReader(); r.readAsDataURL(file);
        r.onload = () => res(r.result.split(',')[1]); 
        r.onerror = e => rej(e);
    });

    // --- 1. Cargar Detalles del Reporte ---
    // Usamos useCallback para que la función sea estática y no resetee el formulario
    const cargarDetallesAPI = useCallback(async (idReporte, modoVista) => {
        setIsLoading(true);
        try {
            let endpoint = `http://localhost:3000/api/reportante/reporte/${idReporte}`;
            if (modoVista === 'CONTADOR') endpoint = `http://localhost:3000/api/contador/reporte/${idReporte}`;
            else if (modoVista === 'JUEZ') endpoint = `http://localhost:3000/api/autorizador/reporte/${idReporte}`;
            else if (modoVista === 'ADMIN') endpoint = `http://localhost:3000/api/admin/reporte/${idReporte}`;
                
            const response = await fetch(endpoint);
            const result = await response.json();
            return result; 
        } catch (error) {
            console.error("Error al cargar reporte:", error);
            return { success: false, error };
        } finally {
            setIsLoading(false);
        }
    }, []); // <-- Array vacío para memorizarla permanentemente

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

            // ✨ OBTENCIÓN DE FECHA LOCAL PURA (Evita el salto de día por UTC)
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
                    fecha_registro: fechaLocalStr // ✨ CORRECCIÓN: Se envía solo la fecha YYYY-MM-DD sin hora
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

    // --- 3. Ejecutar Acciones Simples (Put requests) ---
    const ejecutarAccionSimple = useCallback(async (url, method = 'PUT', body = null) => {
        setIsLoading(true);
        try {
            const options = { method, headers: { 'Content-Type': 'application/json' } };
            if (body) options.body = JSON.stringify(body);
            
            const response = await fetch(url, options);
            const result = await response.json();
            if (!result.success) throw new Error(result.error || "Error en la operación");
            return { success: true };
        } catch (error) {
            console.error(error);
            return { success: false, error: error.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    const cancelarEnvioAPI = useCallback((id) => ejecutarAccionSimple(`http://localhost:3000/api/reportante/cancelar/${id}`), [ejecutarAccionSimple]);
    const eliminarBorradorAPI = useCallback((id) => ejecutarAccionSimple(`http://localhost:3000/api/reportante/eliminar/${id}`), [ejecutarAccionSimple]);
    
    const accionJuezAPI = useCallback((id, accion) => {
        const payload = accion === 'APROBAR' 
            ? { estado: 'Autorizado y Enviado a Contabilidad', codigo_autorizador: parseInt(user.codigo) } 
            : { estado: 'Denegado' };
        return ejecutarAccionSimple(`http://localhost:3000/api/autorizador/estado/${id}`, 'PUT', payload);
    }, [ejecutarAccionSimple, user]);

    const accionContadorAPI = useCallback((id) => {
        return ejecutarAccionSimple(`http://localhost:3000/api/contador/contabilizar/${id}`, 'PUT', { codigo_contador: parseInt(user.codigo) });
    }, [ejecutarAccionSimple, user]);

    const accionAdminAPI = useCallback((id) => {
        return ejecutarAccionSimple(`http://localhost:3000/api/admin/recepcionar/${id}`, 'PUT', { codigo_recepcion: parseInt(user.codigo), estado: 'Recibido por Planillas' });
    }, [ejecutarAccionSimple, user]);

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