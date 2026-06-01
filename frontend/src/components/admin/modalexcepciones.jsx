// src/components/admin/modalexcepciones.jsx
import { Base } from './comunes/base';
import { Encabezado } from './comunes/encabezado';
import { useLogicaExcepciones } from './logica/use_logica_excepciones';

const formatearFecha = (fechaStr) => {
    if (!fechaStr) return "--/--/--";
    const [y, m, d] = fechaStr.split('T')[0].split('-');
    return `${d.substring(0, 2)}/${m}/${y.slice(-2)}`;
};

export const ModalExcepciones = ({ onClose }) => {
    // 🔌 Conexión con el Custom Hook
    const {
        view, setView,
        excepciones,
        periodoActivo,
        isLoading,
        notificacion,
        infoReportante,
        infoAutorizador,
        formData, setFormData,
        handleReportanteBlur,
        handleAutorizadorBlur,
        handleNuevaExcepcion,
        handleEditarExcepcion,
        handleGuardar
    } = useLogicaExcepciones();

    const configEncabezado = {
        titulo: view === 'LIST' ? 'Tiempo de Gracia' : (formData.id ? 'Editar Par de Excepción' : 'Nuevo Tiempo de Gracia'),
        icono: view === 'LIST' ? 'fas fa-hourglass-half' : null,
        textoBoton: '+ NUEVA',
        mostrarBoton: view === 'LIST',
        onAccion: handleNuevaExcepcion,
        onClose: view === 'LIST' ? onClose : () => setView('LIST')
    };

    return (
        <Base view={view}>
            <Encabezado {...configEncabezado} />

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
                                <th style={{ textAlign: 'center' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {excepciones.length === 0 ? (
                                <tr><td colSpan="7" className="text-center p-20 text-muted">No hay excepciones vinculadas activas.</td></tr>
                            ) : (
                                excepciones.map(exc => (
                                    <tr key={exc.id}>
                                        <td className="font-bold">{exc.periodos?.codigo_periodo || exc.id_periodo}</td>
                                        
                                        {/* ✨ ETIQUETA VISUAL DE TIPO DE PERMISO */}
                                        <td>
                                            <span 
                                                className="admin-exc-badge" 
                                                style={{ backgroundColor: exc.tipo_permiso === 'AUTORIZAR' ? 'var(--azul-oscuro)' : 'var(--vino)' }}
                                            >
                                                {exc.tipo_permiso === 'AUTORIZAR' ? 'AUTORIZAR' : 'CREAR'}
                                            </span>
                                        </td>

                                        <td className="font-bold text-vino">
                                            <i className="fas fa-user-edit"></i> {exc.codigo_empleado || 'N/A'}
                                        </td>
                                        <td className="font-bold admin-exc-td-blue">
                                            <i className="fas fa-user-check"></i> {exc.codigo_autorizador || 'Mismo (Auto)'}
                                        </td>
                                        <td>{formatearFecha(exc.nueva_fecha_corte)} - {exc.nueva_hora_corte?.substring(0, 5)}</td>
                                        <td className="text-muted italic">{exc.motivo || '-'}</td>
                                        <td className="admin-exc-th-center">
                                            <button className="btn-sec btn-sm" onClick={() => handleEditarExcepcion(exc.id)}>
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
                <div className="modal-body admin-exc-body-padding">
                    
                    <div className="form-group">
                        <label>Periodo de Planilla en Curso:</label>
                        <select className="m-input" value={formData.id_periodo} disabled>
                            <option value={formData.id_periodo}>{periodoActivo?.codigo_periodo || 'Cargando periodo activo...'}</option>
                        </select>
                    </div>

                    {/* ✨ SELECTOR DE TIPO DE PERMISO (Con lógica de limpieza) */}
                    <div className="form-group">
                        <label>Tipo de Permiso de Gracia:</label>
                        <select 
                            className="m-input admin-exc-select-bold" 
                            style={{ color: formData.tipo_permiso === 'AUTORIZAR' ? 'var(--azul-oscuro)' : 'var(--vino)' }}
                            value={formData.tipo_permiso || 'CREAR'} 
                            onChange={(e) => {
                                const nuevoTipo = e.target.value;
                                setFormData({
                                    ...formData, 
                                    tipo_permiso: nuevoTipo,
                                    // Si cambiamos a AUTORIZAR, borramos el reportante para no mandar basura a la base de datos
                                    codigo_empleado: nuevoTipo === 'AUTORIZAR' ? '' : formData.codigo_empleado
                                });
                            }} 
                            disabled={isLoading}
                        >
                            <option value="CREAR">Permiso para Crear Reporte (CREAR)</option>
                            <option value="AUTORIZAR">Permiso para Autorizar Reportes (AUTORIZAR)</option>
                        </select>
                    </div>

                    {/* ✨ FORMULARIO DINÁMICO: Solo mostramos al reportante si el permiso es CREAR */}
                    {(!formData.tipo_permiso || formData.tipo_permiso === 'CREAR') && (
                        <div className="form-row admin-exc-form-row-start">
                            <div className="form-group admin-exc-col-35">
                                <label>Reportante:</label>
                                <input 
                                    type="number" className="m-input" placeholder="" 
                                    value={formData.codigo_empleado || ''} 
                                    onChange={(e) => setFormData({...formData, codigo_empleado: e.target.value})} 
                                    onBlur={(e) => handleReportanteBlur(e.target.value)} disabled={isLoading} 
                                />
                            </div>
                            <div className="form-group admin-exc-col-65-pad">
                                <span className="rh-value admin-exc-rh-value-box">
                                    {infoReportante ? (
                                        <span className="admin-exc-text-ellipsis">
                                            <strong>{infoReportante.nombre}</strong> <span style={{ color: '#64748b' }}>({infoReportante.email})</span>
                                        </span>
                                    ) : <span className="text-muted italic">Ingrese código...</span>}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* El Autorizador siempre se muestra, pero cambia su contexto visualmente */}
                    <div className="form-row admin-exc-form-row-start">
                        <div className="form-group admin-exc-col-35">
                            <label>{formData.tipo_permiso === 'AUTORIZAR' ? 'Código del Autorizador:' : 'Autorizador:'}</label>
                            <input 
                                type="number" className="m-input" placeholder="" 
                                value={formData.codigo_autorizador || ''} 
                                onChange={(e) => setFormData({...formData, codigo_autorizador: e.target.value})} 
                                onBlur={(e) => handleAutorizadorBlur(e.target.value)} disabled={isLoading} 
                            />
                        </div>
                        <div className="form-group admin-exc-col-65-pad">
                            <span className="rh-value admin-exc-rh-value-box">
                                {infoAutorizador ? (
                                    <span className="admin-exc-text-ellipsis">
                                        <strong>{infoAutorizador.nombre}</strong> <span style={{ color: '#64748b' }}>({infoAutorizador.email})</span>
                                    </span>
                                ) : <span className="text-muted italic">Ingrese código...</span>}
                            </span>
                        </div>
                    </div>

                    <div className="form-row admin-exc-form-row">
                        <div className="form-group flex-1">
                            <label>Nueva Fecha de Corte:</label>
                            <input type="date" className="m-input" value={formData.nueva_fecha_corte || ''} onChange={(e) => setFormData({...formData, nueva_fecha_corte: e.target.value})} disabled={isLoading} />
                        </div>
                        <div className="form-group flex-1">
                            <label>Nueva Hora de Corte:</label>
                            <input type="time" className="m-input" value={formData.nueva_hora_corte || ''} onChange={(e) => setFormData({...formData, nueva_hora_corte: e.target.value})} disabled={isLoading} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Motivo del Tiempo de Gracia:</label>
                        <input type="text" className="m-input" placeholder="" value={formData.motivo || ''} onChange={(e) => setFormData({...formData, motivo: e.target.value})} disabled={isLoading} />
                    </div>
                    
                    <div className="modal-footer admin-exc-footer-margin">
                        <button className="btn-sec" onClick={() => setView('LIST')} disabled={isLoading}>CANCELAR</button>
                        <button className="btn-pri" onClick={handleGuardar} disabled={isLoading}>
                            {isLoading ? <><i className="fas fa-spinner fa-spin"></i> PROCESANDO</> : "GUARDAR"}
                        </button>
                    </div>
                </div>
            )}

            {notificacion.mensaje && (
                <div id="notif-container" style={{ position: 'fixed', zIndex: 99999 }}>
                    <div className={`toast-notif ${notificacion.tipo}`}>{notificacion.mensaje}</div>
                </div>
            )}
        </Base>
    );
};