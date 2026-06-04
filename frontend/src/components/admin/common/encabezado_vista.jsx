/**
 * Encabezado universal modular para los submundos del panel administrativo.
 * Separa de forma limpia las herramientas de la izquierda de los botones del extremo derecho.
 */
export const EncabezadoVista = ({ titulo, icono, textoBoton, onAccion, mostrarBoton = false, onClose, children }) => {
    return (
        <div className="modal-header-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}>
            <div className="admin-header-group-left" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 className="no-margin-title">
                    {icono && <i className={`${icono} admin-header-icon`}></i>} {titulo}
                </h3>
                {mostrarBoton && (
                    <button type="button" className="btn-nuevo" onClick={onAccion}>{textoBoton}</button>
                )}
            </div>
            
            {/* Contenedor derecho: Agrupamos botones limpios sin interferencia */}
            <div className="admin-header-group-right" style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingRight: '20px' }}>
                {children}
            </div>

            {/* Botón de cierre absoluto flotante en la esquina superior derecha de la tarjeta */}
            {onClose && (
                <i 
                    className="fas fa-times close-modal" 
                    onClick={onClose} 
                    title="Cerrar" 
                    style={{ 
                        position: 'absolute', 
                        top: '22px', 
                        right: '24px', 
                        cursor: 'pointer', 
                        fontSize: '1.3rem', 
                        color: '#64748b',
                        zIndex: 100
                    }}
                ></i>
            )}
        </div>
    );
};