/**
 * Modal secundario flotante de confirmation táctica y alertas preventivas del negocio.
 */
export const CuadroConfirmacion = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    icon = 'fas fa-exclamation-triangle', 
    message, 
    confirmText = 'Confirmar', 
    confirmColor = 'var(--vino)', 
    isLoading = false 
}) => {
    if (!isOpen) return null;

    return (
        <div className="admin-confirm-overlay">
            <div className="modal-content glass-card-formulario text-center admin-confirm-content">
                <h3 className="modal-title-warning admin-confirm-title" style={{ color: confirmColor }}>
                    {icon && <i className={icon}></i>} {title}
                </h3>
                
                <div className="modal-text-warning admin-confirm-text">
                    {message}
                </div>
                
                <div className="admin-confirm-actions" style={{ display: 'flex', flexDirection: 'row', gap: '12px' }}>
                                     <button 
                                          type="button" 
                                          className="btn-sec admin-confirm-btn-cancel"
                                          onClick={onClose}
                                          disabled={isLoading}
                                          style={{ flex: 1 }}
                                     >
                                         Cancelar
                                     </button>
                                     <button 
                                          type="button" 
                                          className="btn-pri admin-confirm-btn-action"
                                          style={{ backgroundColor: confirmColor, flex: 1 }}
                                          onClick={onConfirm}
                                          disabled={isLoading}
                                     >
                        {isLoading ? (
                            <>
                                <i className="fas fa-spinner fa-spin admin-period-icon-spacing"></i> Procesando...
                            </>
                        ) : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};