import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../hooks/useauth';
import { api } from '../../../../services/api';

export const useLogicaReportanteVar = (periodoSeleccionado) => {
    const { user } = useAuth();
    const [reportes, setReportes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [catalogos, setCatalogos] = useState({ marcas: [], centrosCosto: [], variables: [], periodos: [] });
    const [listaExcepciones, setListaExcepciones] = useState([]);
    const [isReporteOpen, setIsReporteOpen] = useState(false);
    const [reporteEdicionId, setReporteEdicionId] = useState(null);

    // 1. Cargar Catálogos Iniciales
    useEffect(() => {
        const cargarCatalogosIniciales = async () => {
            try {
                const res = await api.reportante.getInicial();
                if (res) {
                    setCatalogos({
                        marcas: res.marcas || [],
                        centrosCosto: res.centrosCosto || [],
                        variables: res.variables || [],
                        periodos: res.periodos || [],
                        // 🚀 AGREGADO: Sincronizamos las propiedades dinámicas con la BD
                        porcentajeCargoMarca: res.porcentajeCargoMarca,
                        porcentaje: res.porcentajeCargoMarca
                    });
                }
            } catch (error) {
                console.error("Error cargando catálogos:", error);
            }
        };
        cargarCatalogosIniciales();
    }, []);

    // 2. Cargar Excepciones
    useEffect(() => {
        const verificarExcepciones = async () => {
            if (!periodoSeleccionado || !user?.codigo) {
                setListaExcepciones([]);
                return;
            }
            try {
                const res = await api.shared.getExcepcionActiva(periodoSeleccionado, user.codigo);
                setListaExcepciones(res?.data || []);
            } catch (error) {
                console.error("Error consultando excepciones:", error);
                setListaExcepciones([]);
            }
        };
        verificarExcepciones();
    }, [periodoSeleccionado, user?.codigo]);

    // 3. LA REGLA DE ORO: Bloqueo Maestro
    const periodoActual = catalogos.periodos.find(p => String(p.id) === String(periodoSeleccionado));
    const estadoActual = periodoActual?.estado?.toString().trim().toUpperCase();
    const isCerrado = estadoActual === 'CERRADO' || estadoActual === 'INACTIVO';

    let puedeCrearReporte = false;

    if (!isCerrado && periodoActual) {
        const ahora = new Date().getTime();
        const finGlobal = new Date(`${periodoActual.fecha_corte}T${periodoActual.hora_corte}`).getTime();
        
        if (ahora <= finGlobal) {
            puedeCrearReporte = true;
        } else {
            const excComoCreador = listaExcepciones.find(e => 
                String(e.codigo_empleado) === String(user?.codigo) && 
                (e.tipo_permiso || 'CREAR') === 'CREAR'
            );

            if (excComoCreador && excComoCreador.nueva_fecha_corte) {
                const finGracia = new Date(`${excComoCreador.nueva_fecha_corte.split('T')[0]}T${excComoCreador.nueva_hora_corte.substring(0, 8)}`).getTime();
                if (ahora <= finGracia) {
                    puedeCrearReporte = true;
                }
            }
        }
    }

    // 4. Cargar Bandeja
    const cargarBandeja = useCallback(async () => {
        if (!periodoSeleccionado || !user?.codigo) return;
        setIsLoading(true);
        try {
            const res = await api.reportante.getMisReportes(periodoSeleccionado, user.codigo);
            setReportes(res?.data || []);
        } catch (error) {
            console.error("Error cargando reportes:", error);
            setReportes([]);
        } finally {
            setIsLoading(false);
        }
    }, [periodoSeleccionado, user]);

    useEffect(() => {
        const timeoutId = setTimeout(() => { cargarBandeja(); }, 0);
        return () => clearTimeout(timeoutId);
    }, [cargarBandeja]);

    const handleAbrirNuevoReporte = () => {
        setReporteEdicionId(null);
        setIsReporteOpen(true);
    };

    const handleVerDetalleReporte = (reporte) => {
        const id = typeof reporte === 'object' ? reporte.id : reporte;
        setReporteEdicionId(id);
        setIsReporteOpen(true);
    };

    return {
        reportes,
        isLoading,
        catalogos,
        isReporteOpen,
        setIsReporteOpen,
        reporteEdicionId,
        puedeCrearReporte,
        periodoActual,
        cargarBandeja,
        handleAbrirNuevoReporte,
        handleVerDetalleReporte
    };
};