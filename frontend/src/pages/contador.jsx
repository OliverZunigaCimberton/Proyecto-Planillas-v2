import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { BarraSuperior } from '../components/shared/barrasuperior';
import { BandejaReportes } from '../components/shared/bandejareportes';
import { ModalMaestroReporte } from "../components/fases/variables/modal_maestro_reporte";

import { useBandejaVariables } from '../components/fases/variables/logica/useBandejaVariables';

export const Contador = () => {
    const { fase } = useParams();
    const [periodoSeleccionado, setPeriodoSeleccionado] = useState('');

    // 🚀 Inyectamos el parámetro 'CONTADOR'
    const logicaVar = useBandejaVariables(fase === 'variables' ? periodoSeleccionado : '', 'CONTADOR');

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
            />

            <main className="main-container">
                <div className="action-header" style={{ justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', width: '100%' }}>
                    <h2 className="view-title" style={{ color: 'white', fontWeight: 800, fontSize: '1.5rem', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                        <i className={iconosFase[fase] || 'fas fa-folder'}></i> {titulosFase[fase] || 'Bandeja de Contabilidad'}
                    </h2>
                </div>

                {/* 🚀 ENRUTADOR INTERNO DE COMPONENTES */}
                {fase === 'variables' && (
                    <BandejaReportes 
                        reportes={logicaVar.reportes} 
                        isLoading={logicaVar.isLoading} 
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
                    modoVista='CONTADOR'
                    onRefreshBandeja={logicaVar.cargarBandeja}
                    onClose={() => logicaVar.setIsReporteOpen(false)} 
                />
            )}
        </div>
    );
};