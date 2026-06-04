import { ContenedorBase } from '../common/contenedor_base';
import { EncabezadoVista } from '../common/encabezado_vista';
import { ModalFormulario } from './components/modal_formulario';
import { useExcepciones } from './logic/use_excepciones';
import styles from './styles/excepciones.module.css';

/**
 * Componente raíz y orquestador táctico del submundo de Tiempos de Gracia (Excepciones).
 * Alterna limpiamente entre el historial de prórrogas activas y el formulario de alta.
 */
export const PanelExcepciones = ({ onClose }) => {
    const {
        view,
        setView,
        excepciones,
        periodoActivo,
        isLoading,
        notificacion,
        infoReportante,
        infoAutorizador,
        formData,
        setFormData,
        handleReportanteBlur,
        handleAutorizadorBlur,
        handleNuevaExcepcion,
        handleEditarExcepcion,
        handleGuardar
    } = useExcepciones();

    // Formateador visual local rápido para la columna cronológica del listado
    const formatearFechaVista = (fechaStr) => {
        if (!fechaStr) return "--/--/--";
        const parteFecha = fechaStr.split('T')[0];
        const [anio, mes, dia] = parteFecha.split('-');
        return `${dia}/${mes}/${anio.slice(-2)}`;
    };

    // Diccionario de configuración del encabezado según el estado de la vista
    const obtenerConfiguracionEncabezado = () => {
        if (view === 'LIST') {
            return {
                titulo: 'Tiempo de Gracia',
                icono: 'fas fa-hourglass-half',
                textoBoton: '+ NUEVA',
                mostrarBoton: true,
                onAccion: () => handleNuevaExcepcion('CREAR'),
                onClose: onClose // Cierra por completo este universo administrativo
            };
        }

        return {
            titulo: formData.id ? 'Editar Par de Excepción' : 'Nuevo Tiempo de Gracia',
            icono: formData.id ? 'fas fa-edit' : 'fas fa-plus-circle',
            textoBoton: '',
            mostrarBoton: false,
            onAccion: () => {},
            onClose: () => setView('LIST') // Cancela la creación y regresa al historial tabular
        };
    };

    const configEncabezado = obtenerConfiguracionEncabezado();

    return (
        <ContenedorBase vista={view}>
            {/* Encabezado Común Adaptativo */}
            <EncabezadoVista
                titulo={configEncabezado.titulo}
                icono={configEncabezado.icono}
                textoBoton={configEncabezado.textoBoton}
                mostrarBoton={configEncabezado.mostrarBoton}
                onAccion={configEncabezado.onAccion}
                onClose={configEncabezado.onClose}
            />

            {/* Renderizado de Pantallas por Condición */}
            {view === 'LIST' ? (
                <div className="table-scroll">
                    <table className="tabla-historial">
                        <thead>
                            <tr>
                                <th>Periodo</th>
                                <th>Tipo Permiso</th>
                                <th>Reportante</th>
                                <th>Autorizador Asignado</th>
                                <th>Extensión de Corte</th>
                                <th>Motivo</th>
                                <th className={styles.adminExcThCenter}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {excepciones.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center p-20 text-muted">
                                        No hay excepciones vinculadas activas en la quincena.
                                    </td>
                                </tr>
                            ) : (
                                excepciones.map((exc) => (
                                    <tr key={exc.id}>
                                        <td className="font-bold">
                                            {exc.periodos?.codigo_periodo || exc.id_periodo}
                                        </td>
                                        <td>
                                            <span 
                                                className={styles.adminExcBadge} 
                                                style={{ backgroundColor: exc.tipo_permiso === 'AUTORIZAR' ? 'var(--azul-oscuro)' : 'var(--vino)' }}
                                            >
                                                {exc.tipo_permiso === 'AUTORIZAR' ? 'AUTORIZAR' : 'CREAR'}
                                            </span>
                                        </td>
                                        <td className="font-bold text-vino">
                                            <i className="fas fa-user-edit"></i> {exc.codigo_empleado || 'N/A'}
                                        </td>
                                        <td className={`font-bold ${styles.adminExcTdBlue}`}>
                                            <i className="fas fa-user-check"></i> {exc.codigo_autorizador || 'Mismo (Auto)'}
                                        </td>
                                        <td>
                                            {formatearFechaVista(exc.nueva_fecha_corte)} - {exc.nueva_hora_corte?.substring(0, 5)}
                                        </td>
                                        <td className="text-muted italic">{exc.motivo || '-'}</td>
                                        <td className={styles.adminExcThCenter}>
                                            <button 
                                                type="button" 
                                                className="btn-sec btn-sm" 
                                                onClick={() => handleEditarExcepcion(exc)}
                                            >
                                                <i className="fas fa-edit"></i> EDITAR
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <ModalFormulario
                    formData={formData}
                    setFormData={setFormData}
                    periodoActivo={periodoActivo}
                    isLoading={isLoading}
                    infoReportante={infoReportante}
                    infoAutorizador={infoAutorizador}
                    handleReportanteBlur={handleReportanteBlur}
                    handleAutorizadorBlur={handleAutorizadorBlur}
                    handleGuardar={handleGuardar}
                    setView={setView}
                />
            )}

            {/* Sistema de Toasts local del micro-mundo */}
            {notificacion.mensaje && (
                <div id="notif-container" style={{ position: 'fixed', zIndex: 99999 }}>
                    <div className={`toast-notif ${notificacion.tipo}`}>
                        {notificacion.mensaje}
                    </div>
                </div>
            )}
        </ContenedorBase>
    );
};