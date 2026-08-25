import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { BarraSuperior } from '../components/shared/barrasuperior';
import { BandejaReportesVariables } from '../components/fases/variables/interfaz/bandeja_reportes_variables';

import { ModalMaestroReporte } from "../components/fases/variables/modal_maestro_reporte";
import { VistaPrincipal } from '../components/admin/vista_principal';
import { useBandejaVariables } from '../components/fases/variables/logica/useBandejaVariables';

// ✨ NUEVAS IMPORTACIONES: El cerebro del Excel y tu servicio de API
import { generarExcelMasivo } from '../utils/exportadorMasivoAdmin';
import { api } from '../services/api';

/**
 * Página Principal del Rol Administrador.
 * Gobierna la visualización de las bandejas de control global y orquesta
 * la apertura de los modales administrativos unificados de la plataforma.
 */
export const Admin = () => {
    const { fase } = useParams(); 
    const [periodoSeleccionado, setPeriodoSeleccionado] = useState('');
    const [modalActivo, setModalActivo] = useState(null); 

    // ✨ NUEVO ESTADO: Bloquea el botón mientras se construye el Excel
    const [isExportando, setIsExportando] = useState(false);

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

    // ✨ NUEVO CONTROLADOR: Orquesta la extracción de base de datos y construcción de Excel
    const handleExportacionMasiva = async () => {
        if (!periodoSeleccionado || periodoSeleccionado === 'none') {
            return alert("Por favor, seleccione un periodo en la barra superior antes de exportar.");
        }

        try {
            setIsExportando(true);
            
            // 1. Llamamos a la base de datos (Trae el JSON gigante)
            const res = await api.admin.getExportacionMasiva(periodoSeleccionado);

            if (res && res.success) {
                // 2. Extraemos el texto de la fecha del catálogo para nombrar el archivo físico
                let nombreFiltro = "Quincena";
                const periodoInfo = logicaVar.catalogos?.periodos?.find(p => String(p.id) === String(periodoSeleccionado));
                if (periodoInfo && periodoInfo.fecha_desde) {
                    const [y, m, d] = periodoInfo.fecha_desde.split('T')[0].split('-');
                    nombreFiltro = `${d}_${m}_${y}`;
                }

                // 3. Le entregamos la data cruda a ExcelJS para que haga la magia
                await generarExcelMasivo(res.data, nombreFiltro);
            } else {
                alert("No se pudo generar la exportación: " + (res.error || "Datos no encontrados"));
            }
        } catch (error) {
            console.error("Error al exportar reporte masivo:", error);
            alert("Ocurrió un error al procesar el archivo. Revisa la consola.");
        } finally {
            setIsExportando(false);
        }
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
                            onClick={handleExportacionMasiva}
                            disabled={isExportando}
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px',
                                opacity: isExportando ? 0.7 : 1,
                                cursor: isExportando ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {isExportando ? (
                                <><i className="fas fa-spinner fa-spin"></i> Procesando Data...</>
                            ) : (
                                <><i className="fas fa-file-excel"></i> Exportar Masivo</>
                            )}
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