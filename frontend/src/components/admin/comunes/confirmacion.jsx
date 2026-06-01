// src/components/admin/comunes/confirmacion.jsx

export const Confirmacion = ({ 
    isOpen, onClose, onConfirm, title, icon, message, confirmText, confirmColor, isLoading 
}) => {
    if (!isOpen) return null;

    return (
        <div className="admin-confirm-overlay">
            <div className="modal-content glass-card-formulario text-center admin-confirm-content">
                <h3 className="modal-title-warning admin-confirm-title" style={{ color: confirmColor }}>
                    <i className={icon}></i> {title}
                </h3>
                <div className="modal-text-warning admin-confirm-text">
                    {message}
                </div>
                <div className="admin-confirm-actions">
                    <button type="button" className="btn-sec admin-confirm-btn-cancel" onClick={onClose} disabled={isLoading}>
                        Cancelar
                    </button>
                    <button type="button" className="btn-pri admin-confirm-btn-action" style={{ backgroundColor: confirmColor }} onClick={onConfirm} disabled={isLoading}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};