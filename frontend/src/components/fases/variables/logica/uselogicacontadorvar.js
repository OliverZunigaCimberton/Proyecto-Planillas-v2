import { useState, useEffect, useCallback } from 'react';

export const useLogicaContadorVar = (periodoSeleccionado) => {
    const [reportes, setReportes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [catalogos, setCatalogos] = useState({ marcas: [], centrosCosto: [], variables: [], periodos: [] });
    
    // Controladores del Modal Maestro
    const [modalOpen, setModalOpen] = useState(false);
    const [reporteEdicionId, setReporteEdicionId] = useState(null);

    // 1. Cargar Catálogos Iniciales del Servidor
    useEffect(() => {
        const fetchCatalogos = async () => {
            try {
                const response = await fetch(`http://localhost:3000/api/contador/inicial`);
                const result = await response.json();
                if (result.success) {
                    setCatalogos({
                        marcas: result.marcas || [],
                        centrosCosto: result.centrosCosto || [],
                        variables: result.variables || [],
                        periodos: result.periodos || []
                    });
                }
            } catch (error) {
                console.error("Error al cargar catálogos:", error);
            }
        };
        fetchCatalogos();
    }, []);

    // 2. Cargar Bandeja de Contabilidad
    const cargarBandeja = useCallback(async () => {
        if (!periodoSeleccionado || periodoSeleccionado === 'none') {
            setReportes(prev => prev.length > 0 ? [] : prev);
            return;
        }
        
        setIsLoading(true);
        try {
            const response = await fetch(`http://localhost:3000/api/contador/bandeja/${periodoSeleccionado}`);
            const result = await response.json();
            setReportes(result.data || []);
        } catch (error) {
            console.error("Error al cargar bandeja del contador:", error);
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

    // 3. Controladores de apertura de detalles
    const handleAbrirReporte = (reporte) => {
        const id = typeof reporte === 'object' ? reporte.id : reporte;
        setReporteEdicionId(id);
        setModalOpen(true);
    };

    const periodoActivoObj = catalogos.periodos.find(p => String(p.id) === String(periodoSeleccionado));

    return {
        reportes,
        isLoading,
        catalogos,
        modalOpen,
        setModalOpen,
        reporteEdicionId,
        periodoActivoObj,
        cargarBandeja,
        handleAbrirReporte
    };
};