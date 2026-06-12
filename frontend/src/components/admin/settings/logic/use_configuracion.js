// frontend/src/components/admin/settings/logic/use_configuracion.js
import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../../services/api';

/**
 * Hook controlador encargado de la gestión de estados asíncronos, consultas base,
 * sincronización de catálogos maestro y orquestación de menús en el submundo de configuraciones.
 */
export const useConfiguraciones = () => {
    const [vistaActiva, setVistaActiva] = useState('SELECTOR'); // 'SELECTOR' | 'CARGO' | 'MARCAS' | 'VARIABLES'
    const [isLoading, setIsLoading] = useState(true);
    const [catalogos, setCatalogos] = useState({ marcas: [], variables: [], porcentaje: 0 });
    const [tienePeriodoAbierto, setTienePeriodoAbierto] = useState(false);
    const [toast, setToast] = useState({ visible: false, titulo: '', mensaje: '', tipo: 'success' });

    // Lanzador controlado de avisos con limpieza automática por temporizador
    const lanzarToast = useCallback((titulo, mensaje, tipo = 'success') => {
        setToast({ visible: true, titulo, mensaje, tipo });
        setTimeout(() => {
            setToast(prev => ({ ...prev, visible: false }));
        }, 3500);
    }, []);

    // Descarga unificada de los catálogos de variables, recargos y marcas desde la API
    const cargarParametrosBase = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await api.admin.getInicial();
            
            if (res && res.success) {
                const listaPeriodos = res.periodos || [];
                setTienePeriodoAbierto(listaPeriodos.some(p => p.estado === 'ABIERTO'));
                setCatalogos({
                    marcas: res.marcas || [],
                    variables: res.variables || [],
                    porcentaje: res.porcentajeCargoMarca ?? 0
                });
            }
        } catch (error) {
            console.error("Error crítico recuperando catálogos de configuración:", error);
            // 🛡️ CORRECCIÓN LÍNEA 42: Se restaura el mensaje plano estático sin variables indefinidas
            lanzarToast(
                "Error de Carga", 
                "No se pudieron inicializar los parámetros globales corporativos.", 
                "error"
            );
        } finally {
            setIsLoading(false);
        }
    }, [lanzarToast]);

    // Inicialización asíncrona segura libre de bloqueos en cascada en el hilo principal
    useEffect(() => {
        let activo = true;

        queueMicrotask(() => {
            if (activo) {
                cargarParametrosBase();
            }
        });

        return () => {
            activo = false;
        };
    }, [cargarParametrosBase]);

    // Pipeline de refresco y sincronización tras mutaciones exitosas en subcomponentes
    const handleRefrescoExitoso = useCallback(async (tipoConfig) => {
        try {
            setIsLoading(true);
            const res = await api.admin.getInicial();
            if (res && res.success) {
                const listaPeriodos = res.periodos || [];
                setTienePeriodoAbierto(listaPeriodos.some(p => p.estado === 'ABIERTO'));
                setCatalogos({
                    marcas: res.marcas || [],
                    variables: res.variables || [],
                    porcentaje: res.porcentajeCargoMarca ?? 0
                });
                
                // ✅ AQUÍ SÍ SE USA tipoConfig porque la función lo recibe como argumento arriba
                lanzarToast(
                    "", 
                    `Catálogo de ${tipoConfig} actualizado con éxito en el servidor`, 
                    "success"
                );
            }
        } catch (error) {
            console.error("Error refrescando parámetros:", error);
            lanzarToast("Error de Red", "No se pudieron refrescar los datos modificados.", "error");
        } finally {
            setIsLoading(false);
        }
    }, [lanzarToast]);

    return {
        vistaActiva,
        setVistaActiva,
        isLoading,
        catalogos,
        tienePeriodoAbierto,
        toast,
        lanzarToast,
        handleRefrescoExitoso
    };
};