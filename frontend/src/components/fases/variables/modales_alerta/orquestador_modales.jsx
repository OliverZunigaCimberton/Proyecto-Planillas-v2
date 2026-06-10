// src/components/reportes/modales_alerta/orquestador_modales.jsx

export const OrquestadorModales = ({ 
    modalActivo, 
    setModalActivo, 
    isTiempoAgotado, 
    
    // ✨ Estados para la alerta estilizada
    alertaEmergente,
    setAlertaEmergente,

    // Estados específicos para el buscador de autorizador
    codigoAuthBusca,
    setCodigoAuthBusca,
    autorizadorEncontrado,
    onBuscarAutorizador,

    // Funciones que ejecutan las acciones en la base de datos
    onGuardarBorrador,
    onSalirSinGuardar,
    onCancelarEnvio,
    onEliminarReporte,
    onEnviarAutorizador,
    onAccionJuez,
    onAccionContador,
    onAccionAdmin,

    // Datos dinámicos del reporte para confirmación inteligente
    reporteHeader,
    subtotal,
    totalGeneral
}) => {
    const formatoMonedaLocal = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const esCargoMarca = reporteHeader?.cargo_a_marca === 'Si';
    const montoAMostrar = esCargoMarca ? (subtotal || 0) : (totalGeneral || 0);

    // Permitimos renderizar si hay un modal activo O si hay una alerta emergente activa
    if (!modalActivo && (!alertaEmergente || !alertaEmergente.activa)) return null;

    const cerrarModal = () => setModalActivo(null);

    return (
        <>
            {/* 1. CAMBIOS SIN GUARDAR */}
            {modalActivo === 'CAMBIOS_SIN_GUARDAR' && (
                <div className="modal-overlay" style={{ display: 'flex', zIndex: 5000 }}>
                    <div className="modal-content glass-card-formulario modal-sm">
                        <h3 className="modal-title-warning"><i className="fas fa-exclamation-triangle"></i> Cambios sin guardar</h3>
                        <p className="modal-text-warning">¿Qué deseas hacer antes de salir?</p>
                        <div className="modal-button-group-vertical">
                            <button className="btn-pri w-100" onClick={onGuardarBorrador} disabled={isTiempoAgotado}>Guardar como Borrador</button>
                            <button className="btn-sec btn-danger w-100" onClick={onSalirSinGuardar}>Salir sin guardar</button>
                            <button className="btn-sec w-100" onClick={cerrarModal}>Cancelar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. CANCELAR ENVÍO */}
            {modalActivo === 'CANCELAR_ENVIO' && (
                <div className="modal-overlay" style={{ display: 'flex', zIndex: 6000 }}>
                    <div className="modal-content glass-card-formulario modal-sm text-center">
                        <h3 className="modal-title-warning" style={{ color: '#cc0000' }}><i className="fas fa-undo"></i> Cancelar Envío</h3>
                        <p className="modal-text-warning mt-10">¿Deseas revocar el envío de este reporte?</p>
                        <div className="d-flex-gap mt-20">
                            <button className="btn-sec w-100" onClick={cerrarModal}>No, mantener</button>
                            <button className="btn-pri w-100 btn-danger-solid" onClick={onCancelarEnvio} style={{ backgroundColor: '#cc0000', color: 'white', border: 'none' }}>Sí, Cancelar Envío</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. ELIMINAR REPORTE */}
            {modalActivo === 'ELIMINAR' && (
                <div className="modal-overlay" style={{ display: 'flex', zIndex: 6000 }}>
                    <div className="modal-content glass-card-formulario modal-sm text-center">
                        <h3 className="modal-title-warning" style={{ color: '#cc0000' }}><i className="fas fa-trash-alt"></i> Eliminar Reporte</h3>
                        <p className="modal-text-warning mt-10">¿Estás completamente seguro de eliminar este reporte?</p>
                        <div className="d-flex-gap mt-20">
                            <button className="btn-sec w-100" onClick={cerrarModal}>Cancelar</button>
                            <button className="btn-pri w-100 btn-danger-solid" onClick={onEliminarReporte} style={{ backgroundColor: '#cc0000', color: 'white', border: 'none' }}>Confirmar Eliminación</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. BUSCAR AUTORIZADOR */}
            {modalActivo === 'BUSCAR_AUTORIZADOR' && (
                <div className="modal-overlay" style={{ display: 'flex', zIndex: 4000 }}>
                    <div className="modal-content glass-card-formulario modal-sm">
                        <div className="modal-header-box border-bottom-none">
                            <h3>Asignar Autorizador</h3>
                            <i className="fas fa-times close-modal" onClick={cerrarModal}></i>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Código de Empleado (Autorizador):</label>
                                <div className="d-flex-gap">
                                    <input 
                                        type="number" 
                                        className="m-input" 
                                        placeholder="Ej: 1234" 
                                        value={codigoAuthBusca} 
                                        onChange={(e) => setCodigoAuthBusca(e.target.value)} 
                                    />
                                    <button className="btn-sec" onClick={onBuscarAutorizador}><i className="fas fa-search"></i></button>
                                </div>
                            </div>
                            {autorizadorEncontrado && (
                                <div className="auth-info-box d-block mt-10">
                                    <p className="auth-info-text"><strong>Nombre:</strong> {autorizadorEncontrado.nombre}</p>
                                    <p className="auth-info-text-mt"><strong>Correo:</strong> {autorizadorEncontrado.email}</p>
                                </div>
                            )}
                            <div className="modal-footer mt-20">
                                <button className="btn-pri w-100" disabled={!autorizadorEncontrado} onClick={() => setModalActivo('CONFIRMAR_ENVIO')}>
                                    SIGUIENTE <i className="fas fa-arrow-right ml-2"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 5. CONFIRMAR ENVÍO A AUTORIZADOR */}
            {modalActivo === 'CONFIRMAR_ENVIO' && (
                <div className="modal-overlay" style={{ display: 'flex', zIndex: 6000 }}>
                    <div className="modal-content glass-card-formulario modal-sm text-center">
                        <h3 className="modal-title-warning w-100 text-center" style={{ color: '#800020' }}>
                            <i className="fas fa-paper-plane"></i> Confirmar Envío
                        </h3>
                        <p className="modal-text-warning mt-10">
                            ¿Estás seguro que deseas enviar este reporte para su autorización a la siguiente persona?
                        </p>
                        
                        {/* Resumen ejecutivo de los datos del reporte seleccionado */}
                        <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#fffbeb', borderRadius: '6px', textAlign: 'left', border: '1px solid #fef3c7', fontSize: '13px' }}>
                            <div style={{ color: '#92400e' }}><strong>Marca:</strong> {reporteHeader?.marca || 'No especificada'}</div>
                            <div style={{ color: '#92400e', marginTop: '4px' }}>
                                <strong>Monto {esCargoMarca ? '(Subtotal)' : '(Total)'}:</strong> $ {formatoMonedaLocal.format(montoAMostrar)}
                            </div>
                        </div>

                        {autorizadorEncontrado && (
                            <div style={{ marginTop: '10px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px', textAlign: 'left', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                                <div style={{ color: '#334155' }}><strong>Código Autorizador:</strong> {codigoAuthBusca}</div>
                                <div style={{ color: '#334155', margin: '4px 0' }}><strong>Nombre:</strong> {autorizadorEncontrado.nombre}</div>
                                <div style={{ color: '#334155' }}><strong>Correo:</strong> {autorizadorEncontrado.email}</div>
                            </div>
                        )}

                        <div className="d-flex-gap mt-20">
                            <button className="btn-sec w-100" onClick={() => setModalActivo('BUSCAR_AUTORIZADOR')}>
                                <i className="fas fa-arrow-left"></i> Volver
                            </button>
                            <button className="btn-pri w-100" style={{ backgroundColor: '#0f172a', color: 'white', border: 'none' }} onClick={onEnviarAutorizador}>
                                SÍ, ENVIAR
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 6. DENEGAR JUEZ */}
            {modalActivo === 'DENEGAR_JUEZ' && (
                <div className="modal-overlay" style={{ display: 'flex', zIndex: 6000 }}>
                    <div className="modal-content glass-card-formulario modal-sm text-center">
                        <h3 className="modal-title-warning">
                            <i className="fas fa-times-circle text-danger"></i> Denegar
                        </h3>
                        <p className="modal-text-warning mt-10">¿Deseas DENEGAR este reporte?</p>
                        <div className="d-flex-gap mt-20">
                            <button className="btn-sec w-100" onClick={cerrarModal}>Cancelar</button>
                            <button className="btn-pri w-100" onClick={() => onAccionJuez('DENEGAR')} style={{ backgroundColor: '#cc0000', color: 'white', border: 'none' }}>Confirmar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 7. APROBAR JUEZ */}
            {modalActivo === 'APROBAR_JUEZ' && (
                <div className="modal-overlay" style={{ display: 'flex', zIndex: 6000 }}>
                    <div className="modal-content glass-card-formulario modal-sm text-center" style={{ borderRadius: '16px', padding: '30px' }}>
                        <h3 className="modal-title-warning" style={{ color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' }}>
                             <i className="fas fa-check-circle"></i> Autorizar
                        </h3>
                        <p className="modal-text-warning mt-10" style={{ color: '#64748b', fontSize: '15px' }}>
                            ¿Deseas AUTORIZAR este reporte y enviarlo a Contabilidad?
                        </p>
                        <div className="d-flex-gap mt-20">
                            <button className="btn-sec w-100" onClick={cerrarModal} style={{ backgroundColor: '#f1f5f9', color: '#475569', border: 'none', fontWeight: 'bold', borderRadius: '8px' }}>Cancelar</button>
                            <button className="btn-pri w-100" onClick={() => onAccionJuez('APROBAR')} style={{ backgroundColor: '#0f172a', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '8px' }}>CONFIRMAR</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 8. VALIDAR CONTADOR */}
            {modalActivo === 'VALIDAR_CONTADOR' && (
                <div className="modal-overlay" style={{ display: 'flex', zIndex: 6000 }}>
                    <div className="modal-content glass-card-formulario modal-sm text-center" style={{ borderRadius: '16px', padding: '30px' }}>
                        <h3 className="modal-title-warning" style={{ color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' }}>
                            <i className="fas fa-check-circle"></i> Validar Reporte
                        </h3>
                        <p className="modal-text-warning mt-10" style={{ color: '#64748b', fontSize: '15px' }}>
                            ¿Deseas enviar este reporte a Planillas de forma definitiva?
                        </p>
                        <div className="d-flex-gap mt-20">
                            <button className="btn-sec w-100" onClick={cerrarModal} style={{ backgroundColor: '#f1f5f9', color: '#475569', border: 'none', fontWeight: 'bold', borderRadius: '8px' }}>Cancelar</button>
                            <button className="btn-pri w-100" onClick={onAccionContador} style={{ backgroundColor: '#0f172a', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '8px' }}>CONFIRMAR</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 9. RECIBIR ADMIN */}
            {modalActivo === 'RECIBIR_ADMIN' && (
                <div className="modal-overlay" style={{ display: 'flex', zIndex: 6000 }}>
                    <div className="modal-content glass-card-formulario modal-sm text-center" style={{ borderRadius: '16px', padding: '30px' }}>
                        <h3 className="modal-title-warning" style={{ color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' }}>
                            <i className="fas fa-check-circle"></i> Recibir Reporte
                        </h3>
                        <p className="modal-text-warning mt-10" style={{ color: '#64748b', fontSize: '15px' }}>
                            ¿Deseas marcar este reporte como RECIBIDO POR PLANILLAS de forma definitiva?
                        </p>
                        <div className="d-flex-gap mt-20">
                            <button className="btn-sec w-100" onClick={cerrarModal} style={{ backgroundColor: '#f1f5f9', color: '#475569', border: 'none', fontWeight: 'bold', borderRadius: '8px' }}>Cancelar</button>
                            <button className="btn-pri w-100" onClick={onAccionAdmin} style={{ backgroundColor: '#0f172a', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '8px' }}>CONFIRMAR</button>
                        </div>
                    </div>
                </div>
            )}  

            {/* ✨ 10. NUEVA ALERTA ESTILIZADA DEL SISTEMA (Reemplazo del alert nativo) */}
            {alertaEmergente?.activa && (
                <div className="modal-overlay" style={{ display: 'flex', zIndex: 10000, backgroundColor: 'rgba(0,0,0,0.6)' }}>
                    <div className="modal-content" style={{ maxWidth: '450px', textAlign: 'center', padding: '30px', borderRadius: '12px' }}>
                        <i className="fas fa-exclamation-triangle" style={{ fontSize: '3.5rem', color: '#e74c3c', margin: '0 auto 20px auto', display: 'block' }}></i>
                        <h3 style={{ color: '#2c3e50', marginBottom: '15px', fontWeight: 'bold' }}>Aviso del Sistema</h3>
                        <div style={{ color: '#5a6a7a', marginBottom: '25px', whiteSpace: 'pre-wrap', fontSize: '0.95rem', lineHeight: '1.6', textAlign: 'left', background: '#f8f9fa', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #e74c3c' }}>
                            {alertaEmergente.mensaje}
                        </div>
                        <button className="btn-pri" onClick={() => setAlertaEmergente({ activa: false, mensaje: '' })} style={{ width: '100%', padding: '12px', fontSize: '1rem', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '6px' }}>
                            Entendido
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};