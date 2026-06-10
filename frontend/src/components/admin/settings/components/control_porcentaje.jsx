import { useState } from 'react';
import { api } from '../../../../services/api';
import styles from '../styles/configuracion.module.css'; // Sincronizado en singular

/**
 * Subcomponente especializado para la administración y actualización del
 * porcentaje corporativo automatizado de Recargo de Gestión (Cargo a Marca).
 */
export const ControlPorcentaje = ({ porcentajeInicial, onRefresh, notificar, bloqueadoPorPeriodo }) => {
    // Copia de respaldo para identificar mutaciones reactivas externas de la propiedad
    const [prevPorcentaje, setPrevPorcentaje] = useState(porcentajeInicial);
    
    // Inicialización del estado del campo de entrada convirtiendo el decimal base a formato flotante visible
    const [porcentajeInput, setPorcentajeInput] = useState(() => 
        porcentajeInicial !== undefined ? (parseFloat(porcentajeInicial) * 100).toFixed(2) : ''
    );
    const [isLoading, setIsLoading] = useState(false);

    // Sincronización limpia en fase de renderizado para mitigar re-renders en cascada
    if (porcentajeInicial !== prevPorcentaje) {
        setPrevPorcentaje(porcentajeInicial);
        setPorcentajeInput(porcentajeInicial !== undefined ? (parseFloat(porcentajeInicial) * 100).toFixed(2) : '');
    }

    const handleGuardar = async () => {
        const valorNumerico = parseFloat(porcentajeInput);
        if (isNaN(valorNumerico) || valorNumerico < 0) {
            if (notificar) {
                notificar("Validación", "Por favor ingrese un porcentaje válido y mayor o igual a cero.", "error");
            }
            return;
        }

        setIsLoading(true);
        try {
            // Conversión inversa del entero/flotante a la notación decimal requerida por la base de datos
            const decimalBD = valorNumerico / 100;
            const res = await api.admin.actualizarPorcentajeCargo(decimalBD);
            
            if (res.success) {
                if (notificar) {
                    notificar("¡Éxito!", `Porcentaje de Cargo a Marca actualizado al ${porcentajeInput}%`, "success");
                }
                if (onRefresh) onRefresh();
            } else {
                if (notificar) {
                    notificar("Error", res.error || "No se pudo actualizar el parámetro.", "error");
                }
            }
        } catch (error) {
            console.error("Error persistiendo porcentaje de cargo a marca:", error);
            if (notificar) {
                notificar("Error de Red", "Error de conexión al intentar actualizar los parámetros.", "error");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.adminCargoContainer}>
            <h4 className={styles.adminCargoTitle}>Porcentaje de Recargo de Gestión</h4>
            <p className={styles.adminCargoText}>
                Este porcentaje se aplica de forma automática al subtotal de los reportes quincenales cuando se marca la opción "Sí".
            </p>
            
            {bloqueadoPorPeriodo && (
                <p style={{ color: '#b91c1c', fontSize: '12px', fontWeight: 'bold', marginBottom: '15px', background: '#fef2f2', padding: '8px', borderRadius: '6px', border: '1px solid #fee2e2' }}>
                    ⚠️ Edición bloqueada: Existe una quincena actualmente ABIERTA. Debe cerrarse el periodo activo para poder modificar este parámetro contable.
                </p>
            )}

            {/* Contenedor del Campo Numérico */}
            <div className={styles.adminCargoInputWrap}>
                <input 
                    id="cargo-porcentaje-input"
                    type="number" 
                    className={`smart-input font-bold ${styles.adminCargoInput}`} 
                    value={porcentajeInput} 
                    onChange={(e) => setPorcentajeInput(e.target.value)}
                    placeholder="17.25"
                    step="0.01"
                    disabled={isLoading || bloqueadoPorPeriodo}
                    autoComplete="off"
                />
                <span className={styles.adminCargoSymbol}>%</span>
            </div>

            {/* Gatillo de Guardado */}
            <button 
                type="button"
                className="btn-pri mt-20" 
                style={{ width: '100%', backgroundColor: bloqueadoPorPeriodo ? '#cbd5e1' : '', cursor: bloqueadoPorPeriodo ? 'not-allowed' : 'pointer' }} 
                onClick={handleGuardar} 
                disabled={isLoading || bloqueadoPorPeriodo}
            >
                <i className={isLoading ? "fas fa-spinner fa-spin" : "fas fa-save"}></i> Guardar Configuración
            </button>
        </div>
    );
};