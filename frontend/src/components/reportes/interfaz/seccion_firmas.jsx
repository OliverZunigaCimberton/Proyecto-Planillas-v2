// src/components/reportes/modal_maestro/subcomponentes/interfaz/seccion_firmas.jsx

export const SeccionFirmas = ({ firmas }) => {
    return (
        <div className="seccion-firmas">
            <div className="firma-box">
                <div className="firma-linea">{firmas?.elaborado || '-'}</div>
                ELABORADO POR
            </div>
            <div className="firma-box">
                <div className="firma-linea">{firmas?.autorizado || '-'}</div>
                AUTORIZADO POR
            </div>
            <div className="firma-box">
                <div className="firma-linea">{firmas?.contabilizado || '-'}</div>
                CONTABILIZADO POR
            </div>
            <div className="firma-box">
                <div className="firma-linea">{firmas?.recepcionado || '-'}</div>
                RECEPCIONADO POR
            </div>
        </div>
    );
};