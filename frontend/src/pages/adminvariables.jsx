// src/pages/adminvariables.jsx
import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { BarraSuperior } from '../components/shared/barrasuperior';
import { BandejaReportes } from '../components/shared/bandejareportes';
import { ModalPeriodos } from '../components/admin/modalperiodos';
import { ModalExcepciones } from '../components/admin/modalexcepciones';
import { ModalUsuarios } from '../components/admin/modalusuarios';
import { ModalMaestroReporte } from "../components/reportes/modal_maestro_reporte";

export const AdminVariables = () => {
    const [periodoSeleccionado, setPeriodoSeleccionado] = useState('');
    const [reportes, setReportes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [modalActivo, setModalActivo] = useState(null); 

    // Estados para la integración del Modal de Reportes
    const [catalogos, setCatalogos] = useState({ marcas: [], centrosCosto: [], variables: [], periodos: [] });
    const [isReporteOpen, setIsReporteOpen] = useState(false);
    const [reporteEdicionId, setReporteEdicionId] = useState(null);

    // 1. Cargar catálogos (Necesarios para que el Modal renderice variables y marcas)
    useEffect(() => {
        const fetchCatalogos = async () => {
            try {
                const response = await fetch(`http://localhost:3000/api/admin/inicial`);
                const result = await response.json();
                if(result.success) {
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

    // 2. Cargar bandeja de reportes del Admin
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
    }, [periodoSeleccionado]); // Dependencia exacta y limpia para el React Compiler

    // EFECTO DE CONTROL: Se usa un microtimeout para eliminar el error "set-state-in-effect"
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

    return (
        <div className="layout-dashboard">
            {/* Componente Compartido 1: Encabezado y Cronómetro idéntico para todos */}
            <BarraSuperior 
                periodoSeleccionado={periodoSeleccionado} 
                setPeriodoSeleccionado={setPeriodoSeleccionado} 
                onMenuClick={(modal) => setModalActivo(modal)} 
            />

            <main className="main-container">
                <div className="action-header" style={{ justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', width: '100%' }}>
                    <h2 className="view-title" style={{ color: 'white', fontWeight: 800, fontSize: '1.5rem', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                        <i className="fas fa-users-cog"></i> Bandeja de Recursos Humanos
                    </h2>
                </div>

                {/* Componente Compartido 2: Tabla de Reportes Reutilizable */}
                <BandejaReportes 
                    reportes={reportes} 
                    isLoading={isLoading} 
                    codigoPeriodo={periodoSeleccionado}
                    onVerMas={handleVerMas} 
                />
            </main>

            {/* Modales de Control de Gestión del Administrador */}
            {modalActivo === 'PERIODOS' && <ModalPeriodos onClose={() => setModalActivo(null)} />}
            {modalActivo === 'EXCEPCIONES' && <ModalExcepciones onClose={() => setModalActivo(null)} />}
            {modalActivo === 'USUARIOS' && <ModalUsuarios onClose={() => setModalActivo(null)} />}

            {/* Modal de Validación Final (Modo ADMIN) */}
            {isReporteOpen && (
                <ModalMaestroReporte 
                    idReporte={reporteEdicionId} 
                    periodoActivo={periodoActivoObj} 
                    periodoSeleccionado={periodoSeleccionado}
                    catalogos={catalogos} 
                    modoVista='ADMIN'
                    onRefreshBandeja={cargarBandeja}
                    onClose={() => setIsReporteOpen(false)} 
                />
            )}
        </div>
    );
};