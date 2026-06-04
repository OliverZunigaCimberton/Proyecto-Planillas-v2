import styles from '../styles/periodos.module.css';

/**
 * Subcomponente especializado para la parametrización, apertura o edición
 * de los límites cronológicos de un periodo de planillas maestro.
 */
export const FormularioAlta = ({ 
    formData, 
    setFormData, 
    file, 
    setFile, 
    isLoading, 
    handleGuardar, 
    setView 
}) => {
    
    // Cláusula de salvaguarda táctica para mitigar caídas por objetos nulos
    if (!formData) return null;

    const fechaCorte = formData?.fecha_corte || '';
    const horaCorte = formData?.hora_corte || '';
    
    // Sincronización del string para compatibilidad nativa con input datetime-local
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
        <div className={styles.adminPeriodContainer}>
            
            {/* Bloque: Identificador Único de la Quincena */}
            <div className={styles.adminPeriodRow}>
                <div className={styles.adminPeriodGroup}>
                    <label htmlFor="period-codigo-input" className={styles.adminPeriodLabel}>
                        CÓDIGO PERIODO:
                    </label>
                    <input 
                        id="period-codigo-input"
                        type="number" 
                        className={styles.adminPeriodInput}
                        placeholder="Ej: 202611"
                        value={formData?.codigo_periodo || ''} 
                        onChange={(e) => setFormData({ ...formData, codigo_periodo: e.target.value })} 
                        disabled={isLoading} 
                        autoComplete="off"
                    />
                </div>
            </div>
            
            {/* Bloque Coalineado: Cobertura del Rango de Fechas */}
            <div className={styles.adminPeriodRow}>
                <div className={styles.adminPeriodGroup}>
                    <label htmlFor="period-desde-input" className={styles.adminPeriodLabel}>
                        DESDE:
                    </label>
                    <input 
                        id="period-desde-input"
                        type="date" 
                        className={styles.adminPeriodInput}
                        value={formData?.fecha_desde || ''} 
                        onChange={(e) => setFormData({ ...formData, fecha_desde: e.target.value })} 
                        disabled={isLoading} 
                    />
                </div>
                <div className={styles.adminPeriodGroup}>
                    <label htmlFor="period-hasta-input" className={styles.adminPeriodLabel}>
                        HASTA:
                    </label>
                    <input 
                        id="period-hasta-input"
                        type="date" 
                        className={styles.adminPeriodInput}
                        value={formData?.fecha_hasta || ''} 
                        onChange={(e) => setFormData({ ...formData, fecha_hasta: e.target.value })} 
                        disabled={isLoading} 
                    />
                </div>
            </div>

            {/* Bloque: Límite de Ingesta Global (Variables Contables) */}
            <div className={styles.adminPeriodGroup}>
                <label htmlFor="period-corte-input" className={styles.adminPeriodLabel}>
                    LÍMITE DE CORTE:
                </label>
                <input 
                    id="period-corte-input"
                    type="datetime-local" 
                    className={styles.adminPeriodInput}
                    value={datetimeValue}
                    onChange={handleDatetimeChange}
                    disabled={isLoading} 
                />
            </div>
            
            {/* Ingesta de Personal Inicial por Carga Masiva (Solo visible en creación) */}
            {!formData?.id && (
                <div className={styles.adminPeriodGroup}>
                    <label className={styles.adminPeriodLabel}>
                        PERSONAL INITIAL (.XLSX):
                    </label>
                    <div className={styles.adminPeriodFileWrapper}>
                        <label htmlFor="file-upload-periodo" className={styles.adminPeriodFileBtn}>
                            Seleccionar archivo
                        </label>
                        <input 
                            type="file" 
                            id="file-upload-periodo" 
                            accept=".xlsx" 
                            style={{ display: 'none' }} 
                            onChange={(e) => setFile(e.target.files[0] || null)}
                            disabled={isLoading}
                        />
                        <span className={styles.adminPeriodFileText}>
                            {file ? file.name : "Ningún archivo seleccionado"}
                        </span>
                    </div>
                </div>
            )}

            {/* Controles de Pie de Formulario */}
            <div className={styles.adminPeriodFooter}>
                <button 
                    type="button" 
                    className={styles.adminPeriodBtnCancel} 
                    onClick={() => setView('LIST')} 
                    disabled={isLoading}
                >
                    CANCELAR
                </button>
                <button 
                    type="button" 
                    className={styles.adminPeriodBtnSave} 
                    onClick={handleGuardar} 
                    disabled={isLoading}
                >
                    {isLoading ? "GUARDANDO..." : "GUARDAR"}
                </button>
            </div>
        </div>
    );
};