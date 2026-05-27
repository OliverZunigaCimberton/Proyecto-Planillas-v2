// src/components/reportes/controles/controles_carga_masiva.jsx

export const ControlesCargaMasiva = ({ 
    isLoading, 
    isReadOnly, 
    isTiempoAgotado, 
    onDescargarPlantilla, 
    onCargarExcel 
}) => {
    // Si el reporte es de solo lectura o el periodo está cerrado/vencido, ocultamos la carga masiva
    if (isReadOnly || isTiempoAgotado) return null;

    return (
        <>
            <button 
                className="btn-descargar-plantilla" 
                onClick={onDescargarPlantilla} 
                disabled={isLoading}
                title="Descargar formato base de Excel"
            >
                <i className="fas fa-download"></i> Descargar Plantilla
            </button>
            
            <label 
                htmlFor="excel-masivo-input" 
                className="btn-sec btn-sm label-excel-masivo"
                title="Subir archivo Excel con variables"
                style={{ 
                    cursor: isLoading ? 'not-allowed' : 'pointer', 
                    opacity: isLoading ? 0.7 : 1 
                }}
            >
                <i className="fas fa-file-excel icon-excel"></i> Carga Masiva
            </label>
            
            <input 
                type="file" 
                id="excel-masivo-input" 
                accept=".xlsx, .xls" 
                style={{ display: 'none' }} 
                onChange={onCargarExcel} 
                disabled={isLoading} 
            />
        </>
    );
};