// src/components/admin/periodos/formularioperiodo.jsx

export const FormularioPeriodo = ({ formData, setFormData, file, setFile, isLoading, handleGuardar, setView }) => {
    
    // 🛡️ CLÁUSULA DE SALVAGUARDA: Evita la pantalla en blanco
    if (!formData) return null;

    const fechaCorte = formData?.fecha_corte || '';
    const horaCorte = formData?.hora_corte || '';
    const datetimeValue = fechaCorte && horaCorte 
        ? `${fechaCorte}T${horaCorte.substring(0, 5)}` 
        : '';

    const handleDatetimeChange = (e) => {
        const val = e.target.value;
        if (val) {
            const [date, time] = val.split('T');
            setFormData({ ...formData, fecha_corte: date, hora_corte: time });
        } else {
            setFormData({ ...formData, fecha_corte: '', hora_corte: '' });
        }
    };

    return (
        <div className="admin-period-container">
            
            {/* CÓDIGO PERIODO EXCLUSIVO */}
            <div className="admin-period-row">
                <div className="admin-period-group">
                    <label className="admin-period-label">CÓDIGO PERIODO:</label>
                    <input 
                        type="number" 
                        className="admin-period-input"
                        placeholder=""
                        value={formData?.codigo_periodo || ''} 
                        onChange={(e) => setFormData({...formData, codigo_periodo: e.target.value})} 
                        disabled={isLoading} 
                    />
                </div>
            </div>
            
            {/* RANGOS DE FECHAS MASIVAS */}
            <div className="admin-period-row">
                <div className="admin-period-group">
                    <label className="admin-period-label">DESDE:</label>
                    <input 
                        type="date" 
                        className="admin-period-input"
                        value={formData?.fecha_desde || ''} 
                        onChange={(e) => setFormData({...formData, fecha_desde: e.target.value})} 
                        disabled={isLoading} 
                    />
                </div>
                <div className="admin-period-group">
                    <label className="admin-period-label">HASTA:</label>
                    <input 
                        type="date" 
                        className="admin-period-input"
                        value={formData?.fecha_hasta || ''} 
                        onChange={(e) => setFormData({...formData, fecha_hasta: e.target.value})} 
                        disabled={isLoading} 
                    />
                </div>
            </div>

            {/* LÍMITE DE CORTE */}
            <div className="admin-period-group">
                <label className="admin-period-label">LÍMITE DE CORTE:</label>
                <input 
                    type="datetime-local" 
                    className="admin-period-input"
                    value={datetimeValue}
                    onChange={handleDatetimeChange}
                    disabled={isLoading} 
                />
            </div>
            
            {/* 🛠️ CARGA DE PERSONAL (Solo visible al crear !formData.id) */}
            {!formData?.id && (
                <div className="admin-period-group">
                    <label className="admin-period-label">PERSONAL INICIAL (.XLSX):</label>
                    <div className="admin-period-file-wrapper">
                        <label htmlFor="file-upload-periodo" className="admin-period-file-btn">
                            Seleccionar archivo
                        </label>
                        <input 
                            type="file" 
                            id="file-upload-periodo" 
                            accept=".xlsx" 
                            style={{ display: 'none' }} 
                            onChange={(e) => setFile(e.target.files[0])}
                            disabled={isLoading}
                        />
                        <span className="admin-period-file-text">
                            {file ? file.name : "Ningún archivo seleccionado"}
                        </span>
                    </div>
                </div>
            )}

            <div className="admin-period-footer">
                <button type="button" className="admin-period-btn-cancel" onClick={() => setView('LIST')} disabled={isLoading}>
                    CANCELAR
                </button>
                <button type="button" className="admin-period-btn-save" onClick={handleGuardar} disabled={isLoading}>
                    {isLoading ? "GUARDANDO..." : "GUARDAR"}
                </button>
            </div>
        </div>
    );
};