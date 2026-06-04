import styles from '../styles/excepciones.module.css';

/**
 * Subcomponente especializado encargado exclusivamente de renderizar los campos,
 * validaciones y flujos de entrada del formulario de Tiempos de Gracia.
 */
export const ModalFormulario = ({
    formData,
    setFormData,
    periodoActivo,
    isLoading,
    infoReportante,
    infoAutorizador,
    handleReportanteBlur,
    handleAutorizadorBlur,
    handleGuardar,
    setView
}) => {
    return (
        <div className={styles.adminExcBodyPadding}>
            {/* Campo: Periodo de Planilla en Curso */}
            <div className="form-group">
                <label htmlFor="exc-periodo-select">Periodo de Planilla en Curso:</label>
                <select 
                    id="exc-periodo-select" 
                    className="m-input" 
                    value={formData.id_periodo} 
                    disabled
                >
                    <option value={formData.id_periodo}>
                        {periodoActivo?.codigo_periodo || 'Cargando periodo activo...'}
                    </option>
                </select>
            </div>

            {/* Campo: Selector de Tipo de Permiso (Cambia dinámicamente de color según el rol) */}
            <div className="form-group">
                <label htmlFor="exc-tipo-select">Tipo de Permiso de Gracia:</label>
                <select 
                    id="exc-tipo-select"
                    className={`m-input ${styles.adminExcSelectBold}`} 
                    style={{ color: formData.tipo_permiso === 'AUTORIZAR' ? 'var(--azul-oscuro)' : 'var(--vino)' }}
                    value={formData.tipo_permiso || 'CREAR'} 
                    onChange={(e) => {
                        const nuevoTipo = e.target.value;
                        setFormData({
                            ...formData, 
                            tipo_permiso: nuevoTipo,
                            // Limpieza de datos preventiva para evitar mandar basura relacional a la base de datos
                            codigo_empleado: nuevoTipo === 'AUTORIZAR' ? '' : formData.codigo_empleado
                        });
                    }} 
                    disabled={isLoading}
                >
                    <option value="CREAR">Permiso para Crear Reporte (CREAR)</option>
                    <option value="AUTORIZAR">Permiso para Autorizar Reportes (AUTORIZAR)</option>
                </select>
            </div>

            {/* Formulario Dinámico: Caja de Reportante (Solo se monta si el tipo de permiso es CREAR) */}
            {(!formData.tipo_permiso || formData.tipo_permiso === 'CREAR') && (
                <div className={`form-row ${styles.adminExcFormRowStart}`}>
                    <div className={`form-group ${styles.adminExcCol35}`}>
                        <label htmlFor="exc-reportante-input">Reportante:</label>
                        <input 
                            id="exc-reportante-input"
                            type="number" 
                            className="m-input" 
                            placeholder="" 
                            value={formData.codigo_empleado || ''} 
                            onChange={(e) => setFormData({ ...formData, codigo_empleado: e.target.value })} 
                            onBlur={handleReportanteBlur} 
                            disabled={isLoading} 
                            autoComplete="off"
                        />
                    </div>
                    <div className={`form-group ${styles.adminExcCol65Pad}`}>
                        <span className={`rh-value ${styles.adminExcRhValueBox}`}>
                            {infoReportante ? (
                                <span className={styles.adminExcTextEllipsis}>
                                    <strong>{infoReportante.nombre}</strong> {infoReportante.email && <span className="text-muted">({infoReportante.email})</span>}
                                </span>
                            ) : (
                                <span className="text-muted italic"></span>
                            )}
                        </span>
                    </div>
                </div>
            )}

            {/* Campo: Autorizador asignado */}
            <div className={`form-row ${styles.adminExcFormRowStart}`}>
                <div className={`form-group ${styles.adminExcCol35}`}>
                    <label htmlFor="exc-autorizador-input">
                        {formData.tipo_permiso === 'AUTORIZAR' ? 'Código del Autorizador:' : 'Autorizador:'}
                    </label>
                    <input 
                        id="exc-autorizador-input"
                        type="number" 
                        className="m-input" 
                        placeholder="" 
                        value={formData.codigo_autorizador || ''} 
                        onChange={(e) => setFormData({ ...formData, codigo_autorizador: e.target.value })} 
                        onBlur={handleAutorizadorBlur} 
                        disabled={isLoading} 
                        autoComplete="off"
                    />
                </div>
                <div className={`form-group ${styles.adminExcCol65Pad}`}>
                    <span className={`rh-value ${styles.adminExcRhValueBox}`}>
                        {infoAutorizador ? (
                            <span className={styles.adminExcTextEllipsis}>
                                <strong>{infoAutorizador.nombre}</strong> {infoAutorizador.email && <span className="text-muted">({infoAutorizador.email})</span>}
                            </span>
                        ) : (
                            <span className="text-muted italic"></span>
                        )}
                    </span>
                </div>
            </div>

            {/* Campos Coalineados: Extensión de Fecha y Hora de Corte */}
            <div className={`form-row ${styles.adminExcFormRow}`}>
                <div className="form-group flex-1">
                    <label htmlFor="exc-fecha-input">Nueva Fecha de Corte:</label>
                    <input 
                        id="exc-fecha-input" 
                        type="date" 
                        className="m-input" 
                        value={formData.nueva_fecha_corte || ''} 
                        onChange={(e) => setFormData({ ...formData, nueva_fecha_corte: e.target.value })} 
                        disabled={isLoading} 
                    />
                </div>
                <div className="form-group flex-1">
                    <label htmlFor="exc-hora-input">Nueva Hora de Corte:</label>
                    <input 
                        id="exc-hora-input" 
                        type="time" 
                        className="m-input" 
                        value={formData.nueva_hora_corte || ''} 
                        onChange={(e) => setFormData({ ...formData, nueva_hora_corte: e.target.value })} 
                        disabled={isLoading} 
                    />
                </div>
            </div>

            {/* Campo: Justificación / Motivo corporativo */}
            <div className="form-group">
                <label htmlFor="exc-motivo-input">Motivo del Tiempo de Gracia:</label>
                <input 
                    id="exc-motivo-input" 
                    type="text" 
                    className="m-input" 
                    placeholder="" 
                    value={formData.motivo || ''} 
                    onChange={(e) => setFormData({ ...formData, motivo: e.target.value })} 
                    disabled={isLoading} 
                    autoComplete="off"
                />
            </div>
            
            {/* Barra Inferior de Acciones */}
            <div className={`modal-footer ${styles.adminExcFooterMargin}`}>
                <button 
                    type="button" 
                    className="btn-sec" 
                    onClick={() => setView('LIST')} 
                    disabled={isLoading}
                >
                    CANCELAR
                </button>
                <button 
                    type="button" 
                    className="btn-pri" 
                    onClick={handleGuardar} 
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <i className="fas fa-spinner fa-spin"></i> PROCESANDO
                        </>
                    ) : (
                        "GUARDAR"
                    )}
                </button>
            </div>
        </div>
    );
};