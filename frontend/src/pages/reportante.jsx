import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { BarraSuperior } from '../components/shared/barrasuperior';
import { BandejaReportes } from '../components/shared/bandejareportes';
import { ModalMaestroReporte } from "../components/fases/variables/modal_maestro_reporte";

import { useBandejaVariables } from '../components/fases/variables/logica/useBandejaVariables';

export const Reportante = () => {
    const { fase } = useParams();
    const [periodoSeleccionado, setPeriodoSeleccionado] = useState('');

    // 🚀 Inyectamos el parámetro 'CREADOR'
    const logicaVar = useBandejaVariables(fase === 'variables' ? periodoSeleccionado : '', 'CREADOR');

    const titulosFase = {
        'variables': 'Bandeja de Reportes - Variables',
        'horas-extras': 'Bandeja de Reportes - Horas Extras',
        'saldos': 'Bandeja de Reportes - Saldos'
    };

    const iconosFase = {
        'variables': 'fas fa-users-cog',
        'horas-extras': 'far fa-clock',
        'saldos': 'fas fa-book-open'
    };

    return (
        <div className="layout-dashboard">
            <BarraSuperior 
                periodoSeleccionado={periodoSeleccionado}
                setPeriodoSeleccionado={setPeriodoSeleccionado}
                onMenuClick={() => {}} 
                vistaActual="MIS_REPORTES"
            />

            <main className="main-container">
                <div className="action-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', width: '100%' }}>
                    <h2 style={{ color: '#ffffff', fontSize: '1.4rem', fontWeight: '600', margin: 0, display: 'flex', alignItems: 'center' }}>
                        <i className={iconosFase[fase] || 'fas fa-folder'} style={{ marginRight: '10px' }}></i> 
                        {titulosFase[fase] || 'Mis Reportes'}
                    </h2>
                    
                    {fase === 'variables' && (
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

                {/* 🚀 ENRUTADOR INTERNO DE COMPONENTES */}
                {fase === 'variables' && (
                    <BandejaReportes 
                        reportes={logicaVar.reportes}
                        isLoading={logicaVar.isLoading}
                        codigoPeriodo={periodoSeleccionado}
                        onVerMas={logicaVar.handleVerDetalleReporte}
                    />
                )}

            </main>

            {fase === 'variables' && logicaVar.isReporteOpen && (
                <ModalMaestroReporte 
                    idReporte={logicaVar.reporteEdicionId}
                    periodoActivo={logicaVar.periodoActual}
                    periodoSeleccionado={periodoSeleccionado} 
                    catalogos={logicaVar.catalogos}
                    modoVista='CREADOR'
                    onClose={() => logicaVar.setIsReporteOpen(false)}
                    onRefreshBandeja={logicaVar.cargarBandeja}
                />
            )}
        </div>
    );
};