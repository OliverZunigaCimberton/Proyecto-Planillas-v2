// src/components/admin/comunes/encabezado.jsx

export const Encabezado = ({ 
    titulo, 
    icono, 
    textoBoton, 
    onAccion, 
    mostrarBoton, 
    onClose, 
    children // Permite inyectar botones extra (como los de Excel)
}) => {
    return (
        <div className="modal-header-box admin-header-container">
            
            {/* GRUPO IZQUIERDO: Título y Botón Principal */}
            <div className="admin-header-group-left">
                <h3 className="no-margin-title admin-header-title">
                    {icono && <i className={`${icono} admin-header-icon`}></i>}
                    {titulo}
                </h3>
                {mostrarBoton && (
                    <button className="btn-nuevo" onClick={onAccion}>{textoBoton}</button>
                )}
            </div>

            {/* GRUPO DERECHO: Herramientas Extra y Botón Cerrar */}
            <div className="admin-header-group-right">
                {children}
                {onClose && (
                    <i 
                        className="fas fa-times close-modal admin-header-close" 
                        onClick={onClose} 
                        title="Cerrar"
                    ></i>
                )}
            </div>
        </div>
    );
};