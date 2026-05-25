// src/components/admin/modalperiodos.jsx

// Importación de Componentes Comunes y Vistas
import { Base } from './comunes/base';
import { Encabezado } from './comunes/encabezado';
import { Confirmacion } from './comunes/confirmacion';
import { ListaPeriodos } from './periodos/listaperiodos';
import { FormularioPeriodo } from './periodos/formularioperiodo';
import { GestionPersonal } from './periodos/gestionpersonal';

// Importación de la Lógica (Cerebro)
import { useLogicaPeriodos } from './logica/use_logica_periodos';

const formatearFecha = (fechaStr) => {
    if (!fechaStr) return "--/--/--";
    const [y, m, d] = fechaStr.split('T')[0].split('-');
    return `${d.substring(0, 2)}/${m}/${y.slice(-2)}`;
};

export const ModalPeriodos = ({ onClose }) => {
    
    // 🔌 Conectamos el componente visual con su Hook de Lógica
    const {
        view, setView,
        periodos,
        empleados,
        periodoSeleccionadoObj,
        isLoading,
        notificacion,
        file, setFile,
        showModalVaciar, setShowModalVaciar,
        periodoACerrar, setPeriodoACerrar,
        formData, setFormData,
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
    } = useLogicaPeriodos();

    // ==========================================
    // RENDERIZADO DINÁMICO DEL ENCABEZADO
    // ==========================================
    const configEncabezado = {
        titulo: view === 'LIST' ? 'Historial de Periodos' : (view === 'FORM' ? (formData.id ? 'Editar Parámetros' : 'Nuevo Periodo') : 'Mantenimiento de Personal'),
        icono: view === 'LIST' ? 'fas fa-calendar-alt' : null,
        textoBoton: '+ NUEVO',
        mostrarBoton: view === 'LIST',
        onAccion: handleNuevoPeriodo,
        onClose: view === 'LIST' ? onClose : () => setView('LIST')
    };

    return (
        <Base view={view}>
            {/* Encabezado Unificado */}
            <Encabezado {...configEncabezado}>
                {/* Inyección dinámica de botones extra solo en la vista PERSONNEL */}
                {view === 'PERSONNEL' && !isPeriodoBloqueado && (
                    <>
                        <label htmlFor="xlsx-personal-recharge" className="btn-sec" style={{ height: '34px', cursor: 'pointer', margin: 0, display: 'flex', alignItems: 'center', padding: '0 16px', fontSize: '11.5px', fontWeight: '700' }}>
                            <i className="fas fa-file-upload" style={{ marginRight: '6px' }}></i> RECARGAR EXCEL
                        </label>
                        <input type="file" id="xlsx-personal-recharge" accept=".xlsx" style={{ display: 'none' }} onChange={handleCargaMasivaPersonal} disabled={isLoading} />
                        
                        <button type="button" className="btn-pri" style={{ backgroundColor: '#0f172a', height: '34px', border: 'none', padding: '0 16px', fontSize: '11.5px', fontWeight: '700' }} onClick={() => setShowModalVaciar(true)} disabled={isLoading}>
                            <i className="fas fa-trash-sweep" style={{ marginRight: '6px' }}></i> VACIAR TODO
                        </button>
                    </>
                )}
            </Encabezado>

            {/* Vistas Renderizadas Condicionalmente */}
            {view === 'LIST' && (
                <ListaPeriodos 
                    periodos={periodos} handleEditarPeriodo={handleEditarPeriodo}
                    handleGestionarPersonal={handleGestionarPersonal} handlePrepararCierre={setPeriodoACerrar}
                    formatearFecha={formatearFecha}
                />
            )}

            {view === 'FORM' && (
                <FormularioPeriodo 
                    formData={formData} setFormData={setFormData}
                    file={file} setFile={setFile} isLoading={isLoading} 
                    handleGuardar={handleGuardar} setView={setView}
                />
            )}

            {view === 'PERSONNEL' && (
                <GestionPersonal 
                    periodo={periodoSeleccionadoObj} empleados={empleados} isLoading={isLoading}
                    handleAgregarManual={handleContainerManualSubmit} handleEliminarEmpleadoManual={handleEliminarEmpleadoManual}
                />
            )}

            {/* Modales de Confirmación de Peligro */}
            <Confirmacion
                isOpen={!!periodoACerrar} onClose={() => setPeriodoACerrar(null)} onConfirm={confirmarCierrePeriodo}
                title="Sellar Periodo" icon="fas fa-lock" confirmColor="#800020"
                confirmText={isLoading ? "Cerrando..." : "Cerrar Definitivamente"} isLoading={isLoading}
                message={<p>¿Está seguro de cerrar el periodo <strong>{periodoACerrar?.codigo_periodo}</strong>? Ya no podrá editar fechas ni modificar la planilla maestro.</p>}
            />

            <Confirmacion
                isOpen={showModalVaciar} onClose={() => setShowModalVaciar(false)} onConfirm={() => { setShowModalVaciar(false); handleVaciarPersonal(); }}
                title="Vaciar Personal" icon="fas fa-exclamation-triangle" confirmColor="#cc0000"
                confirmText="Confirmar" isLoading={isLoading}
                message={<p>¿Está seguro de eliminar <strong>TODO</strong> el personal de este periodo? Esta acción es irreversible.</p>}
            />

            {/* Notificaciones Flotantes */}
            {notificacion.mensaje && (
                <div id="notif-container" style={{ position: 'fixed', zIndex: 99999 }}>
                    <div className={`toast-notif ${notificacion.tipo}`}>{notificacion.mensaje}</div>
                </div>
            )}
        </Base>
    );
};