// src/pages/autorizadorvariables.jsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useauth';
import { api } from '../services/api';
import { BarraSuperior } from '../components/shared/barrasuperior';
import { BandejaReportes } from '../components/shared/bandejareportes';
import { ModalMaestroReporte } from "../components/reportes/modal_maestro_reporte";

export const AutorizadorVariables = () => {
    const { user } = useAuth();
    const [periodoSeleccionado, setPeriodoSeleccionado] = useState('');
    const [vistaActual, setVistaActual] = useState(() => {
        return localStorage.getItem('autorizador_tab_activa') || 'AUTORIZACIONES';
    });
    
    useEffect(() => {
        localStorage.setItem('autorizador_tab_activa', vistaActual);
    }, [vistaActual]);

    const [reportes, setReportes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [catalogos, setCatalogos] = useState({ marcas: [], centrosCosto: [], variables: [], periodos: [] });
    const [isReporteOpen, setIsReporteOpen] = useState(false);
    const [reporteEdicionId, setReporteEdicionId] = useState(null);
    const [listaExcepciones, setListaExcepciones] = useState([]);

    const [hasAlertAutorizaciones, setHasAlertAutorizaciones] = useState(false);
    const [hasAlertMisReportes, setHasAlertMisReportes] = useState(false);

    // Cargar Catálogos
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

    // Cargar Excepciones
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

    // ✨ LA REGLA DE ORO: Bloqueo Maestro para Crear Reporte
    const periodoActual = catalogos.periodos.find(p => String(p.id) === String(periodoSeleccionado));
    const estadoActual = periodoActual?.estado?.toString().trim().toUpperCase();
    const isCerrado = estadoActual === 'CERRADO' || estadoActual === 'INACTIVO';

    let puedeCrearReporte = false;

    if (!isCerrado && periodoActual) {
        const ahora = new Date().getTime();
        const finGlobal = new Date(`${periodoActual.fecha_corte}T${periodoActual.hora_corte}`).getTime();
        
        if (ahora <= finGlobal) {
            // 1. Periodo global abierto y vigente
            puedeCrearReporte = true;
        } else {
            // 2. Periodo vencido, buscamos si tiene excepción para CREAR
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

            // ✨ GESTIÓN DE ALERTAS CORREGIDA (Puntos Rojos)
            const llaveAut = `seen_aut_v3_${periodoSeleccionado}_${user.codigo}`;
            const llaveMis = `seen_mis_v3_${periodoSeleccionado}_${user.codigo}`;
            
            const cacheAut = JSON.parse(localStorage.getItem(llaveAut) || '{}');
            const cacheMis = JSON.parse(localStorage.getItem(llaveMis) || '{}');

            // 1. Bandeja de Autorizaciones
            if (vistaActual === 'AUTORIZACIONES') {
                // Si estoy viendo la bandeja, actualizo la memoria para que ya no haya alertas
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
                // Si NO estoy en la bandeja, solo comparo (sin guardar) para ver si enciendo el punto
                const hayCambios = dataAut.some(r => cacheAut[r.id] !== r.estado);
                setHasAlertAutorizaciones(hayCambios);
            }

            // 2. Bandeja de Mis Reportes
            if (vistaActual === 'MIS_REPORTES') {
                // Si estoy viendo mis reportes, limpio la alerta guardando en memoria
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
                // Si NO estoy en mis reportes, reviso si algo cambió a mis espaldas
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

    return (
        <div className="layout-dashboard">
            <BarraSuperior 
                periodoSeleccionado={periodoSeleccionado}
                setPeriodoSeleccionado={setPeriodoSeleccionado}
                onMenuClick={() => {}}
                vistaActual={vistaActual}
            />

            <main className="main-container">
                <div style={{ maxWidth: '1200px', width: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 32px', marginBottom: '0', zIndex: 10 }}>
                        
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <div 
                                className={`aut-tab ${vistaActual === 'AUTORIZACIONES' ? 'active' : ''}`}
                                onClick={() => setVistaActual('AUTORIZACIONES')}
                            >
                                <i className="fas fa-inbox"></i> 
                                Bandeja de Autorizaciones
                                {hasAlertAutorizaciones && <span className="notification-dot"></span>}
                            </div>
                            <div 
                                className={`aut-tab ${vistaActual === 'MIS_REPORTES' ? 'active' : ''}`}
                                onClick={() => setVistaActual('MIS_REPORTES')}
                            >
                                <i className="fas fa-file-invoice-dollar"></i> 
                                Mis Reportes
                                {hasAlertMisReportes && <span className="notification-dot"></span>}
                            </div>
                        </div>

                        <div style={{ paddingBottom: '12px' }}>
                            {vistaActual === 'MIS_REPORTES' && (
                                <button 
                                    className="btn-reporte-principal" 
                                    onClick={handleAbrirNuevoReporte}
                                    disabled={!puedeCrearReporte}
                                    title={!puedeCrearReporte ? "Periodo cerrado o tiempo agotado" : "Crear reporte"}
                                >
                                    <i className="fas fa-plus"></i> Crear reporte
                                </button>
                            )}
                        </div>
                    </div>

                    <div style={{ position: 'relative', zIndex: 5 }}>
                        <BandejaReportes 
                            reportes={reportes}
                            isLoading={isLoading}
                            onVerMas={handleVerDetalleReporte}
                        />
                    </div>
                </div>
            </main>

            {isReporteOpen && (
                <ModalMaestroReporte 
                    idReporte={reporteEdicionId}
                    periodoActivo={periodoActual}
                    periodoSeleccionado={periodoSeleccionado}
                    catalogos={catalogos}
                    modoVista={vistaActual === 'AUTORIZACIONES' ? 'JUEZ' : 'CREADOR'}
                    onClose={() => setIsReporteOpen(false)}
                    onRefreshBandeja={cargarBandeja}
                />
            )}
        </div>
    );
};