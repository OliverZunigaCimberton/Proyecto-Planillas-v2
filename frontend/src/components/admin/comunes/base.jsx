// src/components/admin/comunes/base.jsx

export const Base = ({ children, view }) => {
    
    // CONFIGURACIÓN POR SEPARADO:
    // Aquí defines el ancho y estilo de cada modal de forma independiente.
    const modalConfigs = {
        'PERSONNEL': { 
            width: '1200px', 
            class: 'glass-card-formulario' // Usamos el formulario porque tiene scroll y estructura interna
        },
        'LIST': { 
            width: '950px', 
            class: 'glass-card-historial' 
        },
        'FORM': { 
            width: '480px', 
            class: 'glass-card-formulario' 
        }
    };

    // Obtener la configuración según la vista, o usar un default si no existe
    const config = modalConfigs[view] || { width: '480px', class: 'glass-card-formulario' };
    
    // Aplicamos la clase base y la específica
    const bgClass = `modal-content ${config.class}`;

    return (
        <div className="modal-overlay" style={{ 
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
            display: 'flex', justifyContent: 'center', alignItems: 'center', 
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 
        }}>
            <div 
                className={bgClass} 
                style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    width: config.width, 
                    maxWidth: '95vw', 
                    maxHeight: '95vh', 
                    overflow: 'hidden', 
                    transition: 'width 0.2s ease-in-out' 
                }}
            >
                {children}
            </div>
        </div>
    );
};