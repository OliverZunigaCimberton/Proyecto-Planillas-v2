import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { BarraSuperior } from '../components/shared/barrasuperior';
import { BandejaReportesVariables } from '../components/fases/variables/interfaz/bandeja_reportes_variables';

import { ModalMaestroReporte } from "../components/fases/variables/modal_maestro_reporte";
import { VistaPrincipal } from '../components/admin/vista_principal';
import { useBandejaVariables } from '../components/fases/variables/logica/useBandejaVariables';

/**
 * Página Principal del Rol Administrador.
 * Gobierna la visualización de las bandejas de control global y orquesta
 * la apertura de los modales administrativos unificados de la plataforma.
 */
export const Admin = () => {
    const { fase } = useParams(); 
    const [periodoSeleccionado, setPeriodoSeleccionado] = useState('');
    const [modalActivo, setModalActivo] = useState(null); 

    // Inyectamos el parámetro 'ADMIN' para la carga polimórfica de reportes
    const logicaVar = useBandejaVariables(fase === 'variables' ? periodoSeleccionado : '', 'ADMIN');

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
            {/* Barra de navegación superior con enlace al selector de modales del administrador */}
            <BarraSuperior 
                periodoSeleccionado={periodoSeleccionado} 
                setPeriodoSeleccionado={setPeriodoSeleccionado} 
                onMenuClick={(modal) => setModalActivo(modal)} 
            />

            <main className="main-container">
                <div className="action-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', width: '100%' }}>
                    <h2 className="view-title" style={{ color: 'white', fontWeight: 800, fontSize: '1.5rem', textShadow: '0 2px 4px rgba(0,0,0,0.3)', margin: 0 }}>
                        <i className={iconosFase[fase] || 'fas fa-folder'}></i> {titulosFase[fase] || 'Bandeja de Control'}
                    </h2>
                    
                    {fase === 'variables' && (
                        <button 
                            type="button"
                            className="btn-reporte-principal" 
                            onClick={() => {}} // ⏱️ Dejado vacío temporalmente para la futura lógica masiva
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <i className="fas fa-file-excel"></i> Exportar Masivo
                        </button>
                    )}
                </div>

                {/* Enrutador interno para las bandejas de cada fase */}
                {fase === 'variables' && (
                    <BandejaReportesVariables 
                        reportes={logicaVar.reportes} 
                        isLoading={logicaVar.isLoading} 
                        codigoPeriodo={periodoSeleccionado}
                        onVerMas={logicaVar.handleVerDetalleReporte} 
                    />
                )}
            </main>

            {/* Renderizado dinámico encapsulado a través del punto de entrada único */}
            {modalActivo && (
                <VistaPrincipal panel={modalActivo} onClose={() => setModalActivo(null)} />
            )}

            {/* Modal Maestro de visualización y auditoría de reportes */}
            {fase === 'variables' && logicaVar.isReporteOpen && (
                <ModalMaestroReporte 
                    idReporte={logicaVar.reporteEdicionId} 
                    periodoActivo={logicaVar.periodoActual} 
                    periodoSeleccionado={periodoSeleccionado}
                    catalogos={logicaVar.catalogos} 
                    modoVista='ADMIN'
                    onRefreshBandeja={logicaVar.cargarBandeja}
                    onClose={() => logicaVar.setIsReporteOpen(false)} 
                />
            )}
        </div>
    );
};