// src/components/reportes/modal_maestro/logica/uselogicaadminvar.js
import { useState, useEffect, useCallback } from 'react';
// Conectamos de forma limpia el Mensajero Oficial
import { api } from '../../../../services/api';

export const useLogicaAdminVar = (periodoSeleccionado) => {
    const [reportes, setReportes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [modalActivo, setModalActivo] = useState(null); 

    // Estados para la integración del Modal de Reportes
    const [catalogos, setCatalogos] = useState({ marcas: [], centrosCosto: [], variables: [], periodos: [] });
    const [isReporteOpen, setIsReporteOpen] = useState(false);
    const [reporteEdicionId, setReporteEdicionId] = useState(null);

    // 1. Cargar catálogos usando el Mensajero Oficial
    useEffect(() => {
        const fetchCatalogos = async () => {
            try {
                // ✨ OPTIMIZACIÓN: Reemplazamos el fetch nativo por la llamada protegida
                const result = await api.admin.getInicial();
                if(result.success) {
                    setCatalogos({
                        marcas: result.marcas || [],
                        centrosCosto: result.centrosCosto || [],
                        variables: result.variables || [],
                        periodos: result.periodos || [],
                        // 🚀 AGREGADO: Sincronizamos las propiedades dinámicas con la BD
                        porcentajeCargoMarca: result.porcentajeCargoMarca,
                        porcentaje: result.porcentajeCargoMarca
                    });
                }
            } catch (error) {
                console.error("Error al cargar catálogos:", error);
            }
        };
        fetchCatalogos();
    }, []);

    // 2. Cargar bandeja de reportes del Admin usando el Mensajero Oficial
    const cargarBandeja = useCallback(async () => {
        if (!periodoSeleccionado) {
            setReportes(prev => prev.length > 0 ? [] : prev);
            return;
        }

        setIsLoading(true);
        try {
            const result = await api.admin.getBandejaReportes(periodoSeleccionado);
            setReportes(result.data || []);
        } catch (error) {
            console.error("Error en bandeja:", error);
            setReportes([]);
        } finally {
            setIsLoading(false);
        }
    }, [periodoSeleccionado]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            cargarBandeja();
        }, 0);
        
        return () => clearTimeout(timeoutId);
    }, [cargarBandeja]);

    // 3. Manejador para abrir el Modal desde la Bandeja
    const handleVerMas = (reporte) => {
        const id = typeof reporte === 'object' ? reporte.id : reporte;
        setReporteEdicionId(id);
        setIsReporteOpen(true);
    };

    const periodoActivoObj = catalogos.periodos.find(p => String(p.id) === String(periodoSeleccionado));

    return {
        reportes,
        isLoading,
        modalActivo,
        setModalActivo,
        catalogos,
        isReporteOpen,
        setIsReporteOpen,
        reporteEdicionId,
        periodoActivoObj,
        cargarBandeja,
        handleVerMas
    };
};