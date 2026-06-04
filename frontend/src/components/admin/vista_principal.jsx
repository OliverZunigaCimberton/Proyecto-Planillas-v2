import { PanelPeriodos } from './periods/panel_periodos';
import { PanelExcepciones } from './exceptions/panel_excepciones';
import { PanelUsuarios } from './users/panel_usuarios';

// 🚀 SOLUCIÓN: Eliminamos la "s" final para que coincida exactamente con tu archivo "panel_configuracion.jsx"
import { PanelConfiguraciones } from './settings/panel_configuracion.jsx';

export const VistaPrincipal = ({ panel, onClose }) => {
    switch (panel) {
        case 'PERIODOS':
            return <PanelPeriodos onClose={onClose} />;
            
        case 'EXCEPCIONES':
            return <PanelExcepciones onClose={onClose} />;
            
        case 'USUARIOS':
            return <PanelUsuarios onClose={onClose} />;
            
        case 'CONFIGURACIONES':
            return <PanelConfiguraciones onClose={onClose} />;
            
        default:
            return null;
    }
};