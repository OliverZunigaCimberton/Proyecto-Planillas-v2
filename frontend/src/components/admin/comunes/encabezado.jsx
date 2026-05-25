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
        <div className="modal-header-box" style={{ paddingBottom: '12px', display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
            
            {/* GRUPO IZQUIERDO: Título y Botón Principal */}
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <h3 className="no-margin-title" style={{ margin: 0, whiteSpace: 'nowrap' }}>
                    {icono && <i className={icono} style={{ marginRight: '8px' }}></i>}
                    {titulo}
                </h3>
                {mostrarBoton && (
                    <button className="btn-nuevo" onClick={onAccion}>{textoBoton}</button>
                )}
            </div>

            {/* GRUPO DERECHO: Herramientas Extra y Botón Cerrar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {children}
                {onClose && (
                    <i 
                        className="fas fa-times close-modal" 
                        onClick={onClose} 
                        style={{ cursor: 'pointer', marginLeft: '10px' }}
                        title="Cerrar"
                    ></i>
                )}
            </div>
        </div>
    );
};