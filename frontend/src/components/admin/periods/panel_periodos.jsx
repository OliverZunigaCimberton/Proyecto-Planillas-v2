import { ContenedorBase } from '../common/contenedor_base';
import { EncabezadoVista } from '../common/encabezado_vista';
import { CuadroConfirmacion } from '../common/cuadro_confirmacion';
import { TablaHistorial } from './components/tabla_historial';
import { FormularioAlta } from './components/formulario_alta';
import { VisorEmpleados } from './components/visor_empleados';
import { usePeriodos } from './logic/use_periodos';
import styles from './styles/periodos.module.css';

/**
 * Orquestador maestro del submundo de Periodos.
 * Coordina de manera centralizada la alternancia de pantallas entre el historial de quincenas,
 * la parametrización de fechas y el mantenimiento de personal de la planilla.
 */
export const PanelPeriodos = ({ onClose }) => {
    
    // Conexión directa con el cerebro operativo del submundo
    const {
        view,
        setView,
        periodos,
        empleados,
        periodoSeleccionadoObj,
        isLoading,
        notificacion,
        file,
        setFile,
        showModalVaciar,
        setShowModalVaciar,
        periodoACerrar,
        setPeriodoACerrar,
        formData,
        setFormData,
        isPeriodoBloqueado,
        handleNuevoPeriodo,
        handleEditarPeriodo,
        handleGestionarPersonal,
        handleGuardar,
        confirmarCierrePeriodo,
        handleCargaMasivaPersonal,
        handleVaciarPersonal,
        handleContainerManualSubmit,
        handleEliminarEmpleadoManual
    } = usePeriodos();

    // Formateador cronológico rápido para renderizado tabular local
    const formatearFechaVista = (fechaStr) => {
        if (!fechaStr) return "--/--/--";
        const [anio, mes, dia] = fechaStr.split('T')[0].split('-');
        return `${dia.substring(0, 2)}/${mes}/${anio.slice(-2)}`;
    };

    // Configuración condicional del encabezado adaptado al estado operativo actual
    const obtenerConfiguracionEncabezado = () => {
        if (view === 'LIST') {
            return {
                titulo: 'Historial de Periodos',
                icono: 'fas fa-calendar-alt',
                textoBoton: '+ NUEVO',
                mostrarBoton: true,
                onAccion: handleNuevoPeriodo,
                onClose: onClose // Cierra por completo este universo administrativo
            };
        }

        if (view === 'FORM') {
            return {
                titulo: formData.id ? 'Editar Parámetros' : 'Nuevo Periodo',
                icono: formData.id ? 'fas fa-edit' : 'fas fa-plus-circle',
                textoBoton: '',
                mostrarBoton: false,
                onAccion: () => {},
                onClose: () => setView('LIST') // Aborta formulario y regresa al historial
            };
        }

        return {
            titulo: 'Mantenimiento de Personal',
            icono: 'fas fa-users-cog',
            textoBoton: '',
            mostrarBoton: false,
            onAccion: () => {},
            onClose: () => setView('LIST') // Sale del visor de nómina y regresa al historial
        };
    };

    const configEncabezado = obtenerConfiguracionEncabezado();

    return (
        <ContenedorBase vista={view}>
            {/* Encabezado Universal */}
            <EncabezadoVista
                titulo={configEncabezado.titulo}
                icono={configEncabezado.icono}
                textoBoton={configEncabezado.textoBoton}
                mostrarBoton={configEncabezado.mostrarBoton}
                onAccion={configEncabezado.onAccion}
                onClose={configEncabezado.onClose}
            >
                {/* Estos elementos se renderizan en el {children} del EncabezadoVista */}
                {view === 'PERSONNEL' && !isPeriodoBloqueado && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <label htmlFor="xlsx-personal-recharge" className={`btn-sec ${styles.adminPeriodBtnRecharge}`}>
                            <i className="fas fa-file-upload" style={{ marginRight: '6px' }}></i> RECARGAR EXCEL
                        </label>
                        <input type="file" id="xlsx-personal-recharge" accept=".xlsx" style={{ display: 'none' }} onChange={handleCargaMasivaPersonal} disabled={isLoading} />
                        
                        <button type="button" className={`btn-pri ${styles.adminPeriodBtnEmpty}`} onClick={() => setShowModalVaciar(true)} disabled={isLoading}>
                            <i className="fas fa-trash-sweep" style={{ marginRight: '6px' }}></i> VACIAR TODO
                        </button>
                    </div>
                )}
            </EncabezadoVista>

            {/* Conmutador de Pantallas del Submundo */}
            {view === 'LIST' && (
                <div style={{ width: '100%', position: 'relative' }}>
                    {/* Al atacar directamente el contenedor nativo de la tabla, evitamos conflictos de capas en el DOM */}
                    <style>{`
                        /* 1. Forzamos la altura dinámica de bandeja al contenedor interno de la tabla */
                        .admin-period-list-scroll {
                            max-height: calc(100vh - 270px) !important;
                            overflow-y: auto !important;
                            padding-right: 4px;
                        }

                        /* 2. Separamos bordes internos (Requisito indispensable para que funcione sticky en th) */
                        .admin-period-list-scroll table {
                            border-collapse: separate !important;
                            border-spacing: 0 !important;
                            width: 100% !important;
                        }

                        /* 3. Congelamos magnéticamente el encabezado en el techo absoluto del scroll */
                        .admin-period-list-scroll table thead th {
                            position: sticky !important;
                            top: 0 !important;
                            z-index: 100 !important;
                            background-color: #f8fafc !important; /* Color gris suave idéntico a las bandejas */
                            box-shadow: inset 0 -1px 0 #e2e8f0 !important; /* Línea divisoria nítida */
                            padding-top: 12px !important;
                            padding-bottom: 12px !important;
                        }
                    `}</style>
                    
                    <TablaHistorial 
                        periodos={periodos} 
                        handleEditarPeriodo={handleEditarPeriodo}
                        handleGestionarPersonal={handleGestionarPersonal} 
                        handlePrepararCierre={setPeriodoACerrar}
                        formatearFecha={formatearFechaVista}
                    />
                </div>
            )}

            {view === 'FORM' && (
                <FormularioAlta 
                    formData={formData} 
                    setFormData={setFormData}
                    file={file} 
                    setFile={setFile} 
                    isLoading={isLoading} 
                    handleGuardar={handleGuardar} 
                    setView={setView}
                />
            )}

            {view === 'PERSONNEL' && (
                <VisorEmpleados 
                    periodo={periodoSeleccionadoObj} 
                    empleados={empleados} 
                    isLoading={isLoading}
                    handleAgregarManual={handleContainerManualSubmit} 
                    handleEliminarManual={handleEliminarEmpleadoManual}
                />
            )}

            {/* Cuadro de Alerta: Confirmar Bloqueo y Cierre Técnico de Quincena */}
            {periodoACerrar && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.4)' }}>
                    <CuadroConfirmacion
                        isOpen={!!periodoACerrar} 
                        onClose={() => setPeriodoACerrar(null)} 
                        onConfirm={confirmarCierrePeriodo}
                        title="Cerrar Periodo" 
                        icon="fas fa-lock" 
                        confirmColor="var(--vino)"
                        confirmText="CERRAR" 
                        isLoading={isLoading}
                        message={
                            <p>
                                ¿Está seguro de cerrar el periodo <strong>{periodoACerrar?.codigo_periodo}</strong>?
                                Esta acción es irreversible y ya no se podrán editar fechas ni modificar la nómina de colaboradores.
                            </p>
                        }
                    />
                </div>
            )}

            {/* Cuadro de Alerta: Confirmar Vaciado Completo de Colaboradores */}
            {showModalVaciar && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.4)' }}>
                    <CuadroConfirmacion
                        isOpen={showModalVaciar} 
                        onClose={() => setShowModalVaciar(false)} 
                        onConfirm={() => { setShowModalVaciar(false); handleVaciarPersonal(); }}
                        title="Vaciar Personal" 
                        icon="fas fa-exclamation-triangle" 
                        confirmColor="var(--vino)"
                        confirmText="VACIAR" 
                        isLoading={isLoading}
                        message={
                            <p>
                                ¿Está seguro de eliminar a <strong>TODOS</strong> los colaboradores de este período?
                            </p>
                        }
                    />
                </div>
            )}

            {/* Sistema Local Flotante de Avisos Toast */}
            {notificacion.mensaje && (
                <div id="notif-container" className="admin-toast-container">
                    <div className={`toast-notif ${notificacion.tipo}`}>
                        {notificacion.mensaje}
                    </div>
                </div>
            )}
        </ContenedorBase>
    );
};