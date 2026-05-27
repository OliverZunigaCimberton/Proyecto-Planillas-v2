import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../hooks/useauth';
import { api } from '../../../../services/api';

export const useLogicaAutorizadorVar = (periodoSeleccionado) => {
    const { user } = useAuth();
    
    // Control de Pestañas con Memoria (LocalStorage)
    const [vistaActual, setVistaActual] = useState(() => {
        return localStorage.getItem('autorizador_tab_activa') || 'AUTORIZACIONES';
    });
    
    useEffect(() => {
        localStorage.setItem('autorizador_tab_activa', vistaActual);
    }, [vistaActual]);

    // Estados Maestros
    const [reportes, setReportes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [catalogos, setCatalogos] = useState({ marcas: [], centrosCosto: [], variables: [], periodos: [] });
    const [isReporteOpen, setIsReporteOpen] = useState(false);
    const [reporteEdicionId, setReporteEdicionId] = useState(null);
    const [listaExcepciones, setListaExcepciones] = useState([]);

    // Estados de Alertas (Puntos Rojos)
    const [hasAlertAutorizaciones, setHasAlertAutorizaciones] = useState(false);
    const [hasAlertMisReportes, setHasAlertMisReportes] = useState(false);

    // 1. Cargar Catálogos
    useEffect(() => {
        const fetchCatalogos = async () => {
            try {
                const response = await fetch(`http://localhost:3000/api/autorizador/inicial`);
                const result = await response.json();
                if(result.success) {
                    setCatalogos({
                        marcas: result.marcas || [],
                        centrosCosto: result.centrosCosto || [],
                        variables: result.variables || [],
                        periodos: result.periodos || []
                    });
                }
            } catch (err) {
                console.error("Error al cargar catálogos:", err);
            }
        };
        fetchCatalogos();
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

    // 3. LA REGLA DE ORO: Bloqueo Maestro para Crear Reporte
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

    // 4. Cargar Bandejas Paralelas y Gestionar Alertas
    const cargarBandeja = useCallback(async () => {
        if (!periodoSeleccionado || !user?.codigo) {
            setReportes([]);
            return;
        }

        setIsLoading(true);
        try {
            const [resAut, resMis] = await Promise.all([
                fetch(`http://localhost:3000/api/autorizador/bandeja/AUTORIZACIONES/${periodoSeleccionado}/${user.codigo}`).then(r => r.json()),
                fetch(`http://localhost:3000/api/autorizador/bandeja/MIS_REPORTES/${periodoSeleccionado}/${user.codigo}`).then(r => r.json())
            ]);

            const dataAut = resAut.data || [];
            const dataMis = resMis.data || [];

            setReportes(vistaActual === 'AUTORIZACIONES' ? dataAut : dataMis);

            // GESTIÓN DE ALERTAS (Puntos Rojos)
            const llaveAut = `seen_aut_v3_${periodoSeleccionado}_${user.codigo}`;
            const llaveMis = `seen_mis_v3_${periodoSeleccionado}_${user.codigo}`;
            
            const cacheAut = JSON.parse(localStorage.getItem(llaveAut) || '{}');
            const cacheMis = JSON.parse(localStorage.getItem(llaveMis) || '{}');

            if (vistaActual === 'AUTORIZACIONES') {
                let actualizo = false;
                dataAut.forEach(r => {
                    if (cacheAut[r.id] !== r.estado) {
                        cacheAut[r.id] = r.estado;
                        actualizo = true;
                    }
                });
                if (actualizo) localStorage.setItem(llaveAut, JSON.stringify(cacheAut));
                setHasAlertAutorizaciones(false);
            } else {
                const hayCambios = dataAut.some(r => cacheAut[r.id] !== r.estado);
                setHasAlertAutorizaciones(hayCambios);
            }

            if (vistaActual === 'MIS_REPORTES') {
                let actualizo = false;
                dataMis.forEach(r => {
                    if (cacheMis[r.id] !== r.estado) {
                        cacheMis[r.id] = r.estado;
                        actualizo = true;
                    }
                });
                if (actualizo) localStorage.setItem(llaveMis, JSON.stringify(cacheMis));
                setHasAlertMisReportes(false);
            } else {
                const hayCambios = dataMis.some(r => cacheMis[r.id] !== r.estado);
                setHasAlertMisReportes(hayCambios);
            }

        } catch (error) {
            console.error("Error al cargar bandejas:", error);
            setReportes([]);
        } finally {
            setIsLoading(false);
        }
    }, [periodoSeleccionado, vistaActual, user]);

    useEffect(() => {
        const timeoutId = setTimeout(() => { cargarBandeja(); }, 0);
        return () => clearTimeout(timeoutId);
    }, [cargarBandeja]);

    const handleVerDetalleReporte = (reporte) => {
        setReporteEdicionId(typeof reporte === 'object' ? reporte.id : reporte);
        setIsReporteOpen(true);
    };

    const handleAbrirNuevoReporte = () => {
        setReporteEdicionId(null);
        setIsReporteOpen(true);
    };

    return {
        vistaActual,
        setVistaActual,
        reportes,
        isLoading,
        catalogos,
        isReporteOpen,
        setIsReporteOpen,
        reporteEdicionId,
        hasAlertAutorizaciones,
        hasAlertMisReportes,
        puedeCrearReporte,
        periodoActual,
        cargarBandeja,
        handleVerDetalleReporte,
        handleAbrirNuevoReporte
    };
};