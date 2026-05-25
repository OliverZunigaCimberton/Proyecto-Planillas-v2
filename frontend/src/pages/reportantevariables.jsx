// src/pages/reportantevariables.jsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useauth';
import { api } from '../services/api';
import { BarraSuperior } from '../components/shared/barrasuperior';
import { BandejaReportes } from '../components/shared/bandejareportes';
import { ModalMaestroReporte } from "../components/reportes/modal_maestro_reporte";

export const ReportanteVariables = () => {
    const { user } = useAuth();
    const [periodoSeleccionado, setPeriodoSeleccionado] = useState('');
    const [reportes, setReportes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    
    const [catalogos, setCatalogos] = useState({ marcas: [], centrosCosto: [], variables: [], periodos: [] });
    const [listaExcepciones, setListaExcepciones] = useState([]);

    const [isReporteOpen, setIsReporteOpen] = useState(false);
    const [reporteEdicionId, setReporteEdicionId] = useState(null);

    // Cargar Catálogos Iniciales
    useEffect(() => {
        const cargarCatalogosIniciales = async () => {
            try {
                const res = await api.reportante.getInicial();
                if (res) {
                    setCatalogos({
                        marcas: res.marcas || [],
                        centrosCosto: res.centrosCosto || [],
                        variables: res.variables || [],
                        periodos: res.periodos || []
                    });
                }
            } catch (error) {
                console.error("Error cargando catálogos:", error);
            }
        };
        cargarCatalogosIniciales();
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
            puedeCrearReporte = true;
        } else {
            // Buscamos si tiene excepción explícita para CREAR
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

    const cargarBandejaColaborador = useCallback(async () => {
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
        const timeoutId = setTimeout(() => { cargarBandejaColaborador(); }, 0);
        return () => clearTimeout(timeoutId);
    }, [cargarBandejaColaborador]); 

    const handleAbrirNuevoReporte = () => {
        setReporteEdicionId(null);
        setIsReporteOpen(true);
    };

    const handleVerDetalleReporte = (reporte) => {
        const id = typeof reporte === 'object' ? reporte.id : reporte;
        setReporteEdicionId(id);
        setIsReporteOpen(true);
    };

    return (
        <div className="layout-dashboard">
            {/* ✨ Le pasamos vistaActual="MIS_REPORTES" para que la barra sepa cómo comportarse */}
            <BarraSuperior 
                periodoSeleccionado={periodoSeleccionado}
                setPeriodoSeleccionado={setPeriodoSeleccionado}
                onMenuClick={() => {}} 
                vistaActual="MIS_REPORTES"
            />

            <main className="main-container">
                <div className="action-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', width: '100%' }}>
                    <h2 style={{ color: '#ffffff', fontSize: '1.4rem', fontWeight: '600', margin: 0, display: 'flex', alignItems: 'center' }}>
                        <i className="fas fa-file-invoice-dollar" style={{ marginRight: '10px' }}></i> 
                        Mis Reportes
                    </h2>
                    
                    <button 
                        className="btn-reporte-principal" 
                        onClick={handleAbrirNuevoReporte}
                        disabled={!puedeCrearReporte}
                        title={!puedeCrearReporte ? "Periodo cerrado o tiempo agotado" : "Crear reporte"}
                    >
                        <i className="fas fa-plus"></i> Crear reporte
                    </button>
                </div>

                <BandejaReportes 
                    reportes={reportes}
                    isLoading={isLoading}
                    codigoPeriodo={periodoSeleccionado}
                    onVerMas={handleVerDetalleReporte}
                />
            </main>

            {isReporteOpen && (
                <ModalMaestroReporte 
                    idReporte={reporteEdicionId}
                    periodoActivo={periodoActual}
                    periodoSeleccionado={periodoSeleccionado} 
                    catalogos={catalogos}
                    modoVista='CREADOR'
                    onClose={() => setIsReporteOpen(false)}
                    onRefreshBandeja={cargarBandejaColaborador}
                />
            )}
        </div>
    );
};