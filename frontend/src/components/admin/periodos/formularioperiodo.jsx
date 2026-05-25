// src/components/admin/periodos/formularioperiodo.jsx

export const FormularioPeriodo = ({ formData, setFormData, file, setFile, isLoading, handleGuardar, setView }) => {
    
    // 🛡️ CLÁUSULA DE SALVAGUARDA: Evita la pantalla en blanco
    if (!formData) return null;

    const estilos = {
        container: {
            display: 'flex',
            flexDirection: 'column',
            gap: '11px',
            padding: '4px 20px 16px 20px',
            backgroundColor: '#ffffff',
            boxSizing: 'border-box',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        },
        row: {
            display: 'flex',
            gap: '14px',
            width: '100%'
        },
        group: {
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            gap: '4px'
        },
        label: {
            fontSize: '10.5px',
            fontWeight: '600',
            color: '#475569',
            textTransform: 'uppercase',
            letterSpacing: '0.3px'
        },
        input: {
            width: '100%',
            height: '34px',
            padding: '0 10px',
            fontSize: '12.5px',
            color: '#334155',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '4px',
            outline: 'none',
            boxSizing: 'border-box'
        },
        fileWrapper: {
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            height: '34px',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '4px',
            overflow: 'hidden',
            boxSizing: 'border-box'
        },
        fileBtn: {
            backgroundColor: '#f1f5f9',
            color: '#334155',
            borderRight: '1px solid #cbd5e1',
            padding: '0 12px',
            height: '100%',
            fontSize: '12px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            whiteSpace: 'nowrap',
            userSelect: 'none'
        },
        fileText: {
            fontSize: '12px',
            color: '#475569',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            paddingLeft: '8px',
            flex: 1
        },
        footer: {
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '8px'
        },
        btnCancel: {
            padding: '0 18px',
            height: '34px',
            fontSize: '11.5px',
            fontWeight: '700',
            color: '#475569',
            backgroundColor: '#f1f5f9',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.2px'
        },
        btnSave: {
            padding: '0 18px',
            height: '34px',
            fontSize: '11.5px',
            fontWeight: '700',
            color: '#ffffff',
            backgroundColor: '#0f172a',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.2px'
        }
    };

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
        <div style={estilos.container}>
            
            {/* CÓDIGO PERIODO EXCLUSIVO */}
            <div style={estilos.row}>
                <div style={estilos.group}>
                    <label style={estilos.label}>CÓDIGO PERIODO:</label>
                    <input 
                        type="number" 
                        style={estilos.input}
                        placeholder=""
                        value={formData?.codigo_periodo || ''} 
                        onChange={(e) => setFormData({...formData, codigo_periodo: e.target.value})} 
                        disabled={isLoading} 
                    />
                </div>
            </div>
            
            {/* RANGOS DE FECHAS MASIVAS */}
            <div style={estilos.row}>
                <div style={estilos.group}>
                    <label style={estilos.label}>DESDE:</label>
                    <input 
                        type="date" 
                        style={estilos.input}
                        value={formData?.fecha_desde || ''} 
                        onChange={(e) => setFormData({...formData, fecha_desde: e.target.value})} 
                        disabled={isLoading} 
                    />
                </div>
                <div style={estilos.group}>
                    <label style={estilos.label}>HASTA:</label>
                    <input 
                        type="date" 
                        style={estilos.input}
                        value={formData?.fecha_hasta || ''} 
                        onChange={(e) => setFormData({...formData, fecha_hasta: e.target.value})} 
                        disabled={isLoading} 
                    />
                </div>
            </div>

            {/* LÍMITE DE CORTE */}
            <div style={estilos.group}>
                <label style={estilos.label}>LÍMITE DE CORTE:</label>
                <input 
                    type="datetime-local" 
                    style={estilos.input}
                    value={datetimeValue}
                    onChange={handleDatetimeChange}
                    disabled={isLoading} 
                />
            </div>
            
            {/* 🛠️ CARGA DE PERSONAL (Solo visible al crear !formData.id) */}
            {!formData?.id && (
                <div style={estilos.group}>
                    <label style={estilos.label}>PERSONAL INICIAL (.XLSX):</label>
                    <div style={estilos.fileWrapper}>
                        <label htmlFor="file-upload-periodo" style={estilos.fileBtn}>
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
                        <span style={estilos.fileText}>
                            {file ? file.name : "Ningún archivo seleccionado"}
                        </span>
                    </div>
                </div>
            )}

            <div style={estilos.footer}>
                <button type="button" style={estilos.btnCancel} onClick={() => setView('LIST')} disabled={isLoading}>
                    CANCELAR
                </button>
                <button type="button" style={estilos.btnSave} onClick={handleGuardar} disabled={isLoading}>
                    {isLoading ? "GUARDANDO..." : "GUARDAR"}
                </button>
            </div>
        </div>
    );
};