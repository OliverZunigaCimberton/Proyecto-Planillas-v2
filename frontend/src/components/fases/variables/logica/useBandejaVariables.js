// src/components/reportes/modal_maestro/logica/useBandejaVariables.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../../hooks/useauth';
import { api } from '../../../../services/api';

// ✨ IMPORTAMOS LA REGLA DE ORO CENTRALIZADA DE LA FASE 1
import { checkTiempoAgotado } from '../../../../utils/dateValidation';

export const useBandejaVariables = (periodoSeleccionado, modoVista = 'CREADOR') => {
    const { user } = useAuth();

    // --- 1. ESTADOS COMUNES ---
    const [reportes, setReportes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [catalogos, setCatalogos] = useState({ marcas: [], centrosCosto: [], variables: [], periodos: [] });
    const [listaExcepciones, setListaExcepciones] = useState([]);
    const [isReporteOpen, setIsReporteOpen] = useState(false);
    const [reporteEdicionId, setReporteEdicionId] = useState(null);

    // --- 2. ESTADOS EXCLUSIVOS DEL AUTORIZADOR (JUEZ) ---
    const [vistaActual, setVistaActual] = useState(() => localStorage.getItem('autorizador_tab_activa') || 'AUTORIZACIONES');
    const [hasAlertAutorizaciones, setHasAlertAutorizaciones] = useState(false);
    const [hasAlertMisReportes, setHasAlertMisReportes] = useState(false);

    useEffect(() => {
        if (modoVista === 'JUEZ') localStorage.setItem('autorizador_tab_activa', vistaActual);
    }, [vistaActual, modoVista]);

    // --- 3. CARGA DE CATÁLOGOS INICIALES ---
    useEffect(() => {
        const cargarCatalogosIniciales = async () => {
            try {
                let fetcher;
                switch(modoVista) {
                    case 'ADMIN': fetcher = api.admin.getInicial; break;
                    case 'CONTADOR': fetcher = api.contador.getInicial; break;
                    case 'JUEZ': fetcher = api.autorizador.getInicial; break;
                    default: fetcher = api.reportante.getInicial; break; // CREADOR
                }
                const res = await fetcher();
                if (res && res.success) {
                    setCatalogos({
                        marcas: res.marcas || [],
                        centrosCosto: res.centrosCosto || [],
                        variables: res.variables || [],
                        periodos: res.periodos || [],
                        porcentajeCargoMarca: res.porcentajeCargoMarca,
                        porcentaje: res.porcentajeCargoMarca
                    });
                }
            } catch (error) {
                console.error(`Error cargando catálogos [${modoVista}]:`, error);
            }
        };
        cargarCatalogosIniciales();
    }, [modoVista]);

    // --- 4. CARGA DE EXCEPCIONES GLOBALES ---
    useEffect(() => {
        const verificarExcepciones = async () => {
            if (!periodoSeleccionado || !user?.codigo || periodoSeleccionado === 'none') {
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

    // --- 5. APLICACIÓN DE LA REGLA DE ORO (Permiso de Creación) ---
    const periodoActual = catalogos.periodos.find(p => String(p.id) === String(periodoSeleccionado));
    
    const puedeCrearReporte = useMemo(() => {
        // Los Auditores y Planillas nunca crean reportes desde su bandeja de revisión
        if (modoVista === 'ADMIN' || modoVista === 'CONTADOR') return false; 
        
        // 🔒 CANDADO ESTRICTO: Si no hay período seleccionado o el período actual NO está ABIERTO, se bloquea la creación
        if (!periodoActual || periodoActual.estado !== 'ABIERTO') return false;

        // Invertimos la lógica utilitaria: Si el tiempo NO está agotado, PUEDE crear
        return !checkTiempoAgotado(periodoActual, listaExcepciones, user?.codigo, 'CREADOR');
    }, [periodoActual, listaExcepciones, user?.codigo, modoVista]);

    // --- 6. CARGA DE BANDEJA POLIMÓRFICA ---
    const cargarBandeja = useCallback(async () => {
        if (!periodoSeleccionado || periodoSeleccionado === 'none' || !user?.codigo) {
            setReportes(prev => prev.length > 0 ? [] : prev);
            return;
        }

        setIsLoading(true);
        try {
            if (modoVista === 'ADMIN') {
                const res = await api.admin.getBandejaReportes(periodoSeleccionado);
                setReportes(res.data || []);
            } else if (modoVista === 'CONTADOR') {
                const res = await api.contador.getBandeja(periodoSeleccionado);
                setReportes(res.data || []);
            } else if (modoVista === 'JUEZ') {
                const [resAut, resMis] = await Promise.all([
                    api.autorizador.getBandeja('AUTORIZACIONES', periodoSeleccionado, user.codigo),
                    api.autorizador.getBandeja('MIS_REPORTES', periodoSeleccionado, user.codigo)
                ]);
                const dataAut = resAut.data || [];
                const dataMis = resMis.data || [];
                setReportes(vistaActual === 'AUTORIZACIONES' ? dataAut : dataMis);

                // Lógica de Puntos Rojos (Alertas de cambios de estado)
                const llaveAut = `seen_aut_v3_${periodoSeleccionado}_${user.codigo}`;
                const llaveMis = `seen_mis_v3_${periodoSeleccionado}_${user.codigo}`;
                const cacheAut = JSON.parse(localStorage.getItem(llaveAut) || '{}');
                const cacheMis = JSON.parse(localStorage.getItem(llaveMis) || '{}');

                if (vistaActual === 'AUTORIZACIONES') {
                    let actualizo = false;
                    dataAut.forEach(r => { if (cacheAut[r.id] !== r.estado) { cacheAut[r.id] = r.estado; actualizo = true; } });
                    if (actualizo) localStorage.setItem(llaveAut, JSON.stringify(cacheAut));
                    setHasAlertAutorizaciones(false);
                } else {
                    setHasAlertAutorizaciones(dataAut.some(r => cacheAut[r.id] !== r.estado));
                }

                if (vistaActual === 'MIS_REPORTES') {
                    let actualizo = false;
                    dataMis.forEach(r => { if (cacheMis[r.id] !== r.estado) { cacheMis[r.id] = r.estado; actualizo = true; } });
                    if (actualizo) localStorage.setItem(llaveMis, JSON.stringify(cacheMis));
                    setHasAlertMisReportes(false);
                } else {
                    setHasAlertMisReportes(dataMis.some(r => cacheMis[r.id] !== r.estado));
                }
            } else {
                // CREADOR (Reportante Estándar)
                const res = await api.reportante.getMisReportes(periodoSeleccionado, user.codigo);
                setReportes(res?.data || []);
            }
        } catch (error) {
            console.error(`Error cargando bandeja [${modoVista}]:`, error);
            setReportes([]);
        } finally {
            setIsLoading(false);
        }
    }, [periodoSeleccionado, modoVista, user, vistaActual]);

    useEffect(() => {
        const timeoutId = setTimeout(() => { cargarBandeja(); }, 0);
        return () => clearTimeout(timeoutId);
    }, [cargarBandeja]);

    // --- 7. MANEJADORES GLOBALES DE INTERFAZ ---
    const handleAbrirNuevoReporte = () => {
        setReporteEdicionId(null);
        setIsReporteOpen(true);
    };

    const handleVerDetalleReporte = (reporte) => {
        setReporteEdicionId(typeof reporte === 'object' ? reporte.id : reporte);
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
        handleVerDetalleReporte,
        
        // Propiedades transferidas por el Juez que los demás roles ignorarán inofensivamente
        vistaActual,
        setVistaActual,
        hasAlertAutorizaciones,
        hasAlertMisReportes
    };
};