import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { BarraSuperior } from '../components/shared/barrasuperior';
import { BandejaReportes } from '../components/shared/bandejareportes';
import { ModalPeriodos } from '../components/admin/modalperiodos';
import { ModalExcepciones } from '../components/admin/modalexcepciones';
import { ModalUsuarios } from '../components/admin/modalusuarios';
import { Confi } from '../components/admin/confi'; // 🚀 Importamos el orquestador de configuraciones
import { ModalMaestroReporte } from "../components/fases/variables/modal_maestro_reporte";
// 🚀 Importamos el hook maestro
import { useBandejaVariables } from '../components/fases/variables/logica/useBandejaVariables';

/* 🎨 Importamos los estilos encapsulados y limpios del Administrador */
import '../components/admin/admin.css';

export const Admin = () => {
    const { fase } = useParams(); 
    const [periodoSeleccionado, setPeriodoSeleccionado] = useState('');
    // 🚀 Recuperamos el estado de los modales administrativos que estaba en el viejo hook
    const [modalActivo, setModalActivo] = useState(null); 

    // 🚀 Inyectamos el parámetro 'ADMIN'
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
            <BarraSuperior 
                periodoSeleccionado={periodoSeleccionado} 
                setPeriodoSeleccionado={setPeriodoSeleccionado} 
                onMenuClick={(modal) => setModalActivo(modal)} 
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
                        onVerMas={logicaVar.handleVerDetalleReporte} 
                    />
                )}

            </main>

            {/* Modales globales del Admin */}
            {modalActivo === 'PERIODOS' && <ModalPeriodos onClose={() => setModalActivo(null)} />}
            {modalActivo === 'EXCEPCIONES' && <ModalExcepciones onClose={() => setModalActivo(null)} />}
            {modalActivo === 'USUARIOS' && <ModalUsuarios onClose={() => setModalActivo(null)} />}
            {modalActivo === 'CONFIGURACIONES' && <Confi onClose={() => setModalActivo(null)} />}

            {/* Modal de Variables */}
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