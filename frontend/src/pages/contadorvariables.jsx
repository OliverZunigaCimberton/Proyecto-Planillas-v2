// src/pages/contadorvariables.jsx
import { useState, useEffect, useCallback } from 'react';
import { BarraSuperior } from '../components/shared/barrasuperior';
import { BandejaReportes } from '../components/shared/bandejareportes';
import { ModalMaestroReporte } from "../components/reportes/modal_maestro_reporte";

export const ContadorVariables = () => {
    const [periodoSeleccionado, setPeriodoSeleccionado] = useState('');
    const [reportes, setReportes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Catálogos e Historiales
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

    // EFECTO DE CONTROL CORREGIDO: micro-timeout asíncrono para eliminar "set-state-in-effect"
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

    return (
        <div className="layout-dashboard">
            {/* Componente Compartido 1: Encabezado y Cronómetro idéntico */}
            <BarraSuperior 
                periodoSeleccionado={periodoSeleccionado} 
                setPeriodoSeleccionado={setPeriodoSeleccionado} 
                onMenuClick={() => {}} 
            />

            <main className="main-container">
                <div className="action-header" style={{ justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', width: '100%' }}>
                    <h2 className="view-title" style={{ color: 'white', fontWeight: 800, fontSize: '1.5rem', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                        <i className="fas fa-file-invoice"></i> Bandeja de Contabilidad
                    </h2>
                </div>

                {/* Componente Compartido 2: Tabla de Reportes Reutilizable */}
                <BandejaReportes 
                    reportes={reportes} 
                    isLoading={isLoading} 
                    onVerMas={handleAbrirReporte} 
                />
            </main>

            {/* Modal transaccional maestro (Modo CONTADOR) */}
            {modalOpen && (
                <ModalMaestroReporte 
                    idReporte={reporteEdicionId} 
                    periodoActivo={periodoActivoObj} 
                    periodoSeleccionado={periodoSeleccionado}
                    catalogos={catalogos} 
                    modoVista='CONTADOR'
                    onRefreshBandeja={cargarBandeja}
                    onClose={() => setModalOpen(false)} 
                />
            )}
        </div>
    );
};