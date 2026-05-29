// src/components/shared/cabecera_corporativa.jsx
import logoCimsa from "../../styles/logos/cimsa.png";
import logoDietco from "../../styles/logos/dietco.png";
import logoSq from "../../styles/logos/sq.png";

// 🚀 Recibe el tamaño deseado. Si no se lo envían, usa 60px por defecto.
export const CabeceraCorporativa = ({ titulo, altoLogos = 60 }) => {
    
    // SQ siempre será un 10% más pequeño visualmente para mantener su proporción corporativa
    const altoSq = altoLogos * 0.9;
    
    // Ajustamos el espaciado interno del texto dinámicamente según el tamaño del logo
    const espaciadoTexto = altoLogos * 4; 

    return (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1px', minHeight: '1px' }}>
            <div style={{ position: 'absolute', left: '0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <img src={logoCimsa} alt="CIMSA" style={{ height: `${altoLogos}px`, width: 'auto', objectFit: 'contain' }} />
                <img src={logoDietco} alt="DIETCO" style={{ height: `${altoLogos}px`, width: 'auto', objectFit: 'contain' }} />
                <img src={logoSq} alt="SQ" style={{ height: `${altoSq}px`, width: 'auto', objectFit: 'contain' }} />
            </div>
            
            <h2 className="reporte-titulo" style={{ 
                margin: 0, 
                textAlign: 'center', 
                width: '100%', 
                paddingLeft: `${espaciadoTexto}px`, 
                paddingRight: `${espaciadoTexto}px`,
                boxSizing: 'border-box'
            }}>
                {titulo}
            </h2>
        </div>
    );
};