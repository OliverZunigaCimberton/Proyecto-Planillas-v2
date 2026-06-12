import { useConfiguraciones } from './logic/use_configuracion';

// 🚀 RUTAS BLINDADAS: Coincidencia exacta con tu árbol de archivos físico y extensiones explícitas
import { ControlPorcentaje } from './components/control_porcentaje.jsx';
import { TablaMarcas } from './components/tabla_marcas.jsx';
import { TablaVariables } from './components/tabla_variables.jsx';

import styles from './styles/configuracion.module.css';

/**
 * Componente raíz y orquestador del submundo de Configuración General.
 * Controla de forma dinámica las dimensiones de la tarjeta contenedora y conmuta
 * entre el selector de parámetros y las interfaces de edición específicas.
 */
export const PanelConfiguraciones = ({ onClose }) => {
    const {
        vistaActiva,
        setVistaActiva,
        isLoading,
        catalogos,
        tienePeriodoAbierto,
        toast,
        lanzarToast,
        handleRefrescoExitoso
    } = useConfiguraciones();

    // Deducción de dimensiones de la tarjeta modal según la complejidad de la vista activa
    const obtenerDimensiones = () => {
        switch (vistaActiva) {
            case 'CARGO': 
                return { maxWidth: '380px', height: 'auto' };
            case 'SELECTOR': 
                return { maxWidth: '460px', height: 'auto' };
            default: 
                return { maxWidth: '780px', height: '85vh' }; 
        }
    };

    const dimensiones = obtenerDimensiones();

    return (
        <div className={styles.adminConfiOverlay}>
            {/* Sistema local de avisos Toast para retroalimentación financiera (Estilo Píldora Sólida) */}
{toast.visible && (
    <div className={`${styles.adminConfiToast} ${toast.tipo === 'success' ? styles.toastSuccessSgp : styles.toastErrorSgp}`}>
        <div className={styles.adminConfiToastFlex}>
            <i className={toast.tipo === 'success' ? "fas fa-check-circle" : "fas fa-exclamation-circle"}></i>
            <span className={styles.adminConfiToastMsgUnificado}>
                {toast.mensaje}
            </span>
        </div>
    </div>
)}

            {/* Tarjeta Base Estructural */}
            <div 
                className={`modal-content modal-reporte-lg ${styles.adminConfiModalBase}`} 
                style={{ maxWidth: dimensiones.maxWidth, height: dimensiones.height }}
            >
                {/* Encabezado contextual adaptativo */}
                <div className={`modal-header-box ${styles.adminConfiHeaderBox}`}>
                    <h3>
                        <i className="fas fa-cogs admin-period-icon-spacing"></i> 
                        {vistaActiva === 'SELECTOR' && "Configuración General"}
                        {vistaActiva === 'CARGO' && "Cargo a Marca"}
                        {vistaActiva === 'MARCAS' && "Catálogo de Marcas"}
                        {vistaActiva === 'VARIABLES' && "Variables Contables"}
                    </h3>
                    <i 
                        className="fas fa-times close-modal" 
                        onClick={() => vistaActiva === 'SELECTOR' ? onClose() : setVistaActiva('SELECTOR')} 
                    ></i>
                </div>

                {/* Contenedor del Cuerpo de Parámetros */}
                <div className={`config-modal-body ${styles.adminConfiBody}`}>
                    {isLoading && (
                        <p className={styles.adminConfiLoader}>
                            <i className="fas fa-spinner fa-spin"></i> Cargando parámetros...
                        </p>
                    )}
                    
                    {!isLoading && (
                        <>
                            {/* Menú Selector de Catálogos */}
                            {vistaActiva === 'SELECTOR' && (
                                <div className={styles.adminConfiMenuLayout}>
                                    <p className={styles.adminConfiMenuDesc}>
                                        Selecciona el parámetro global corporativo que deseas administrar.
                                    </p>
                                    
                                    <button 
                                        type="button" 
                                        className={styles.adminConfiMenuOpt} 
                                        onClick={() => setVistaActiva('CARGO')}
                                    >
                                        <div className={styles.adminConfiMenuIconBox}>
                                            <i className="fas fa-percentage"></i>
                                        </div>
                                        <div className={styles.adminConfiMenuLblBox}>
                                            <strong className={styles.adminConfiMenuLblMain}>Cargo a Marca %</strong>
                                            <span className={styles.adminConfiMenuLblSub}>Porcentaje cargado a marcas</span>
                                        </div>
                                        <i className={`fas fa-chevron-right ${styles.adminConfiMenuArrow}`}></i>
                                    </button>

                                    <button 
                                        type="button" 
                                        className={styles.adminConfiMenuOpt} 
                                        onClick={() => setVistaActiva('MARCAS')}
                                    >
                                        <div className={styles.adminConfiMenuIconBox}>
                                            <i className="fas fa-tags"></i>
                                        </div>
                                        <div className={styles.adminConfiMenuLblBox}>
                                            <strong className={styles.adminConfiMenuLblMain}>Actualizar Marcas</strong>
                                            <span className={styles.adminConfiMenuLblSub}>Agregar, editar o remover Marcas</span>
                                        </div>
                                        <i className={`fas fa-chevron-right ${styles.adminConfiMenuArrow}`}></i>
                                    </button>

                                    <button 
                                        type="button" 
                                        className={styles.adminConfiMenuOpt} 
                                        onClick={() => setVistaActiva('VARIABLES')}
                                    >
                                        <div className={styles.adminConfiMenuIconBox}>
                                            <i className="fas fa-sliders-h"></i>
                                        </div>
                                        <div className={styles.adminConfiMenuLblBox}>
                                            <strong className={styles.adminConfiMenuLblMain}>Actualizar Variables</strong>
                                            <span className={styles.adminConfiMenuLblSub}>Agregar, editar o remover Variables</span>
                                        </div>
                                        <i className={`fas fa-chevron-right ${styles.adminConfiMenuArrow}`}></i>
                                    </button>
                                </div>
                            )}

                            {/* Subcomponentes de Configuración Específica */}
                            {vistaActiva === 'CARGO' && (
                                <ControlPorcentaje 
                                    porcentajeInicial={catalogos.porcentaje} 
                                    onRefresh={() => handleRefrescoExitoso('Porcentaje')} 
                                    onBack={() => setVistaActiva('SELECTOR')} 
                                    notificar={lanzarToast} 
                                    bloqueadoPorPeriodo={tienePeriodoAbierto}
                                />
                            )}
                            
                            {vistaActiva === 'MARCAS' && (
                                <TablaMarcas 
                                    marcas={catalogos.marcas} 
                                    onRefresh={() => handleRefrescoExitoso('Marcas')} 
                                />
                            )}
                            
                            {vistaActiva === 'VARIABLES' && (
                                <TablaVariables 
                                    variables={catalogos.variables} 
                                    onRefresh={() => handleRefrescoExitoso('Variables')} 
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};