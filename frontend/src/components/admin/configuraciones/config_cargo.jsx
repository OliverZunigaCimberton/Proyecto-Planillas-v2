// src/components/admin/configuraciones/config_cargo.jsx
import { useState } from 'react';
import { api } from '../../../services/api';

export const ConfigCargo = ({ porcentajeInicial, onRefresh, notificar }) => {
    // 1. Guardamos una copia de la propiedad original para detectar si cambia en el futuro
    const [prevPorcentaje, setPrevPorcentaje] = useState(porcentajeInicial);
    
    // 2. Inicializamos el campo de texto calculando el porcentaje directamente
    const [porcentajeInput, setPorcentajeInput] = useState(() => 
        porcentajeInicial !== undefined ? (parseFloat(porcentajeInicial) * 100).toFixed(2) : ''
    );
    const [isLoading, setIsLoading] = useState(false);

    // ✨ SOLUCIÓN AL LINTER: Si la propiedad cambia (por ejemplo, tras hacer un onRefresh),
    // actualizamos el estado directamente DURANTE la fase de renderizado.
    // Esto evita usar useEffect y elimina por completo los renders duplicados.
    if (porcentajeInicial !== prevPorcentaje) {
        setPrevPorcentaje(porcentajeInicial);
        setPorcentajeInput(porcentajeInicial !== undefined ? (parseFloat(porcentajeInicial) * 100).toFixed(2) : '');
    }

    const handleGuardar = async () => {
        const valorNumerico = parseFloat(porcentajeInput);
        if (isNaN(valorNumerico) || valorNumerico < 0) {
            // ✨ Cambio: Toast inteligente para error de validación
            if (notificar) notificar("Validación", "Por favor ingrese un porcentaje válido.", "error");
            return;
        }
        setIsLoading(true);
        try {
            const decimalBD = valorNumerico / 100;
            const res = await api.admin.actualizarPorcentajeCargo(decimalBD);
            if (res.success) {
                // ✨ Cambio: Toast inteligente para éxito corporativo
                if (notificar) notificar("¡Éxito!", `Porcentaje de Cargo a Marca actualizado al ${porcentajeInput}%`, "success");
                if (onRefresh) onRefresh();
            } else {
                // ✨ Cambio: Toast inteligente para error de servidor
                if (notificar) notificar("Error", res.error || "No se pudo actualizar.", "error");
            }
        } catch (error) {
            console.error(error);
            // ✨ Cambio: Toast inteligente para fallos de red o desconexión
            if (notificar) notificar("Error de Red", "Error de conexión al actualizar.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '20px auto', textAlign: 'center' }}>
            <h4 style={{ color: '#1e293b', marginBottom: '10px' }}>Porcentaje de Recargo de Gestión</h4>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
                Este porcentaje se aplica de forma automática al subtotal de los reportes cuando se marca la opción "Sí".
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                <input 
                    type="number" 
                    className="smart-input font-bold" 
                    style={{ width: '120px', textAlign: 'center', fontSize: '1.2rem', padding: '8px' }} 
                    value={porcentajeInput} 
                    onChange={(e) => setPorcentajeInput(e.target.value)}
                    placeholder="17.25"
                    step="0.01"
                    disabled={isLoading}
                />
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#475569' }}>%</span>
            </div>
            <button className="btn-pri mt-20" style={{ width: '100%' }} onClick={handleGuardar} disabled={isLoading}>
                <i className={isLoading ? "fas fa-spinner fa-spin" : "fas fa-save"}></i> Guardar Configuración
            </button>
        </div>
    );
};