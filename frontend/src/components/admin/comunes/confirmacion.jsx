// src/components/admin/comunes/confirmacion.jsx

export const Confirmacion = ({ 
    isOpen, onClose, onConfirm, title, icon, message, confirmText, confirmColor, isLoading 
}) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 9999 }}>
            <div className="modal-content glass-card-formulario text-center" style={{ width: '420px', maxWidth: '90vw', overflow: 'hidden', padding: '24px' }}>
                <h3 className="modal-title-warning" style={{ color: confirmColor, margin: '0 0 10px 0' }}>
                    <i className={icon}></i> {title}
                </h3>
                <div className="modal-text-warning" style={{ color: '#475569', fontSize: '13.5px', marginBottom: '24px' }}>
                    {message}
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="button" className="btn-sec" style={{ flex: 1, height: '36px', fontWeight: '700' }} onClick={onClose} disabled={isLoading}>
                        Cancelar
                    </button>
                    <button type="button" className="btn-pri" style={{ flex: 1, height: '36px', fontWeight: '700', backgroundColor: confirmColor, color: 'white', border: 'none' }} onClick={onConfirm} disabled={isLoading}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};