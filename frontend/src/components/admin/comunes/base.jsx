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
        <div className="admin-modal-base-overlay">
            <div 
                className={`${bgClass} admin-modal-base-content`} 
                style={{ width: config.width }}
            >
                {children}
            </div>
        </div>
    );
};