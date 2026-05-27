import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { BarraSuperior } from '../components/shared/barrasuperior';
import { BandejaReportes } from '../components/shared/bandejareportes';
import { ModalPeriodos } from '../components/admin/modalperiodos';
import { ModalExcepciones } from '../components/admin/modalexcepciones';
import { ModalUsuarios } from '../components/admin/modalusuarios';
import { ModalMaestroReporte } from "../components/fases/variables/modal_maestro_reporte";
import { useLogicaAdminVar } from '../components/fases/variables/logica/useLogicaAdminVar';

export const Admin = () => {
    const { fase } = useParams(); 
    const [periodoSeleccionado, setPeriodoSeleccionado] = useState('');

    const logicaVar = useLogicaAdminVar(fase === 'variables' ? periodoSeleccionado : '');

    const titulosFase = {
        'variables': 'Bandeja de Recursos Humanos - Variables',
        'horas-extras': 'Bandeja de Recursos Humanos - Horas Extras',
        'saldos': 'Bandeja de Recursos Humanos - Saldos'
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
                onMenuClick={(modal) => logicaVar.setModalActivo(modal)} 
            />

            <main className="main-container">
                <div className="action-header" style={{ justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', width: '100%' }}>
                    <h2 className="view-title" style={{ color: 'white', fontWeight: 800, fontSize: '1.5rem', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                        <i className={iconosFase[fase] || 'fas fa-folder'}></i> {titulosFase[fase] || 'Bandeja de Control'}
                    </h2>
                </div>

                {/* 🚀 ENRUTADOR INTERNO DE COMPONENTES */}
                {fase === 'variables' && (
                    <BandejaReportes 
                        reportes={logicaVar.reportes} 
                        isLoading={logicaVar.isLoading} 
                        codigoPeriodo={periodoSeleccionado}
                        onVerMas={logicaVar.handleVerMas} 
                    />
                )}

            </main>

            {/* Modales globales del Admin */}
            {logicaVar.modalActivo === 'PERIODOS' && <ModalPeriodos onClose={() => logicaVar.setModalActivo(null)} />}
            {logicaVar.modalActivo === 'EXCEPCIONES' && <ModalExcepciones onClose={() => logicaVar.setModalActivo(null)} />}
            {logicaVar.modalActivo === 'USUARIOS' && <ModalUsuarios onClose={() => logicaVar.setModalActivo(null)} />}

            {/* Modal de Variables */}
            {fase === 'variables' && logicaVar.isReporteOpen && (
                <ModalMaestroReporte 
                    idReporte={logicaVar.reporteEdicionId} 
                    periodoActivo={logicaVar.periodoActivoObj} 
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