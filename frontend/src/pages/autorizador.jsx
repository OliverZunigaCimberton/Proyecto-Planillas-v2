import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { BarraSuperior } from '../components/shared/barrasuperior';
import { BandejaReportes } from '../components/shared/bandejareportes';
import { ModalMaestroReporte } from "../components/fases/variables/modal_maestro_reporte";
import { useBandejaVariables } from '../components/fases/variables/logica/useBandejaVariables';

export const Autorizador = () => {
    const { fase } = useParams();
    const [periodoSeleccionado, setPeriodoSeleccionado] = useState('');

    // 🚀 Inyectamos el parámetro 'JUEZ'
    const logicaVar = useBandejaVariables(fase === 'variables' ? periodoSeleccionado : '', 'JUEZ');

    return (
        <div className="layout-dashboard">
            <BarraSuperior 
                periodoSeleccionado={periodoSeleccionado}
                setPeriodoSeleccionado={setPeriodoSeleccionado}
                onMenuClick={() => {}}
                vistaActual={logicaVar.vistaActual}
            />

            <main className="main-container">
                <div style={{ maxWidth: '1200px', width: '100%', display: 'flex', flexDirection: 'column' }}>
                    
                    {fase === 'variables' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 32px', marginBottom: '0', zIndex: 10 }}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <div 
                                    className={`aut-tab ${logicaVar.vistaActual === 'AUTORIZACIONES' ? 'active' : ''}`}
                                    onClick={() => logicaVar.setVistaActual('AUTORIZACIONES')}
                                >
                                    <i className="fas fa-inbox"></i> Autorizaciones
                                    {logicaVar.hasAlertAutorizaciones && <span className="notification-dot"></span>}
                                </div>
                                <div 
                                    className={`aut-tab ${logicaVar.vistaActual === 'MIS_REPORTES' ? 'active' : ''}`}
                                    onClick={() => logicaVar.setVistaActual('MIS_REPORTES')}
                                >
                                    <i className="fas fa-file-invoice-dollar"></i> Mis Reportes
                                    {logicaVar.hasAlertMisReportes && <span className="notification-dot"></span>}
                                </div>
                            </div>

                            <div style={{ paddingBottom: '12px' }}>
                                {logicaVar.vistaActual === 'MIS_REPORTES' && (
                                    <button 
                                        className="btn-reporte-principal" 
                                        onClick={logicaVar.handleAbrirNuevoReporte}
                                        disabled={!logicaVar.puedeCrearReporte}
                                        title={!logicaVar.puedeCrearReporte ? "Periodo cerrado o tiempo agotado" : "Crear reporte"}
                                    >
                                        <i className="fas fa-plus"></i> Crear reporte
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 🚀 ENRUTADOR INTERNO DE COMPONENTES */}
                    <div style={{ position: 'relative', zIndex: 5 }}>
                        {fase === 'variables' && (
                            <BandejaReportes 
                                reportes={logicaVar.reportes}
                                isLoading={logicaVar.isLoading}
                                onVerMas={logicaVar.handleVerDetalleReporte}
                            />
                        )}

                    </div>
                </div>
            </main>

            {fase === 'variables' && logicaVar.isReporteOpen && (
                <ModalMaestroReporte 
                    idReporte={logicaVar.reporteEdicionId}
                    periodoActivo={logicaVar.periodoActual}
                    periodoSeleccionado={periodoSeleccionado}
                    catalogos={logicaVar.catalogos}
                    modoVista={logicaVar.vistaActual === 'AUTORIZACIONES' ? 'JUEZ' : 'CREADOR'}
                    onClose={() => logicaVar.setIsReporteOpen(false)}
                    onRefreshBandeja={logicaVar.cargarBandeja}
                />
            )}
        </div>
    );
};