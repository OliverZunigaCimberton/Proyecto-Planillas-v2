// src/components/reportes/modal_maestro/logica/uselogicacontadorvar.js
import { useState, useEffect, useCallback } from 'react';
// ✨ NUEVO: Importamos el Mensajero Oficial para proteger las llamadas
import { api } from '../../../../services/api';

export const useLogicaContadorVar = (periodoSeleccionado) => {
    const [reportes, setReportes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [catalogos, setCatalogos] = useState({ marcas: [], centrosCosto: [], variables: [], periodos: [] });
    
    // Controladores del Modal Maestro
    const [modalOpen, setModalOpen] = useState(false);
    const [reporteEdicionId, setReporteEdicionId] = useState(null);

    // 1. Cargar Catálogos Iniciales del Servidor usando el Mensajero Oficial
    useEffect(() => {
        const fetchCatalogos = async () => {
            try {
                // Usamos el método seguro centralizado
                const result = await api.contador.getInicial();
                if (result.success) {
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

    // 2. Cargar Bandeja de Contabilidad usando el Mensajero Oficial
    const cargarBandeja = useCallback(async () => {
        if (!periodoSeleccionado || periodoSeleccionado === 'none') {
            setReportes(prev => prev.length > 0 ? [] : prev);
            return;
        }
        
        setIsLoading(true);
        try {
            // Reemplazamos el fetch manual por la llamada blindada al periodo seleccionado
            const result = await api.contador.getBandeja(periodoSeleccionado);
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