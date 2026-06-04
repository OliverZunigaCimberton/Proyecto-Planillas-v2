/**
 * Componente contenedor estructural para estandarizar las dimensiones y el comportamiento
 * visual (glassmorphism) de todos los paneles del administrador.
 */
export const ContenedorBase = ({ children, vista = 'FORM' }) => {
    const configuracionesModal = {
        'PERSONNEL': { ancho: '1200px', claseEstilo: 'glass-card-formulario' },
        'LIST': { ancho: '950px', claseEstilo: 'glass-card-historial' },
        'FORM': { ancho: '480px', claseEstilo: 'glass-card-formulario' }
    };

    const configActual = configuracionesModal[vista.toUpperCase()] || configuracionesModal['FORM'];

    // 🚀 CORRECCIÓN: Forzamos posicionamiento absoluto/fijo y centrado absoluto
    const estilosOverlay = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.6)', // Oscurecimiento de fondo
        backdropFilter: 'blur(5px)',
        zIndex: 9000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    };

    return (
        <div style={estilosOverlay}>
            {/* Agregamos position: 'relative' para que la 'X' se posicione respecto a esta tarjeta */}
            <div 
                className={`modal-content ${configActual.claseEstilo}`} 
                style={{ 
                    width: configActual.ancho, 
                    height: 'auto', 
                    maxHeight: 'none', 
                    overflow: 'visible', 
                    position: 'relative' 
                }}
            >
                {children}
            </div>
        </div>
    );
};