// src/components/reportes/modal_maestro/subcomponentes/interfaz/fila_variable.jsx
import { memo, useState, useEffect } from 'react';
import { SmartAutocomplete } from '../../../shared/smartdropdown';

export const FilaVariable = memo(({ 
    linea, 
    index, 
    isReadOnly, 
    isLoading, 
    isTiempoAgotado, 
    catalogos, 
    onChangeLinea, 
    onBlurEmpleado, 
    onBlurMonto, 
    onEliminarFila 
}) => {

    // ✨ Estados locales para escritura ultra-rápida (Evita el Input Lag)
    const [codigoLocal, setCodigoLocal] = useState(linea.codigo_empleado || '');
    const [montoLocal, setMontoLocal] = useState(linea.monto || '');

    // ✨ Sincronización automática si los datos vienen masivamente desde el padre (ej. Carga de Excel)
    useEffect(() => {
        setCodigoLocal(linea.codigo_empleado || '');
        setMontoLocal(linea.monto || '');
    }, [linea.codigo_empleado, linea.monto]);

    // ✨ Disparadores diferidos (Solo avisan al padre cuando el usuario termina de escribir)
    const handleCodigoBlur = () => {
        if (codigoLocal !== linea.codigo_empleado) {
            onChangeLinea(index, 'codigo_empleado', codigoLocal);
        }
        onBlurEmpleado(index, codigoLocal);
    };

    const handleMontoBlur = () => {
        if (montoLocal !== linea.monto) {
            onChangeLinea(index, 'monto', montoLocal);
        }
        onBlurMonto(index);
    };

    return (
        <tr>
            <td>
                <input 
                    type="text" 
                    className="smart-input" 
                    style={{ textAlign: 'center' }} 
                    value={codigoLocal} 
                    disabled={isReadOnly || isLoading || isTiempoAgotado} 
                    onChange={(e) => setCodigoLocal(e.target.value.replace(/\D/g, ''))} 
                    onBlur={handleCodigoBlur}
                />
            </td>
            <td className="cell-ro font-bold" style={{ textAlign: 'left', paddingLeft: '10px' }}>{linea.empleado_nombre}</td>
            <td className="cell-ro" style={{ textAlign: 'left', paddingLeft: '10px' }}>{linea.empleado_puesto}</td>
            <td>
                {/* 🚀 CORRECCIÓN: Cambiamos displayKey y value para renderizar exclusivamente el CÓDIGO de la variable */}
                <SmartAutocomplete 
                    placeholder="" 
                    data={catalogos.variables} 
                    displayKey="codigo_variable" 
                    value={linea.codigo_variable} 
                    disabled={isReadOnly || isLoading || isTiempoAgotado}
                    onSelect={(item) => {
                        onChangeLinea(index, 'id_variable', item.id);
                        onChangeLinea(index, 'codigo_variable', item.codigo_variable);
                        onChangeLinea(index, 'nombre_variable', item.nombre_variable);
                    }}
                />
            </td>
            {/* La siguiente columna mantiene el Nombre completo en modo lectura para perfecta referencia del usuario */}
            <td className="cell-ro" style={{ textAlign: 'left', paddingLeft: '10px' }}>{linea.nombre_variable}</td>
            <td className="bg-gray">
                <div style={{ display: 'flex', alignItems: 'center', justifycontent: 'center', color: 'var(--vino)' }}>
                    <span>$</span>
                    <input 
                        type="text" 
                        className="smart-input font-bold text-vino" 
                        style={{ background: 'transparent', border: 'none' }} 
                        value={montoLocal} 
                        disabled={isReadOnly || isLoading || isTiempoAgotado} 
                        onChange={(e) => setMontoLocal(e.target.value)} 
                        onBlur={handleMontoBlur} 
                    />
                </div>
            </td>
            {!isReadOnly && !isTiempoAgotado && (
                <td className="col-acciones-var">
                    <button className="btn-del-row" onClick={() => onEliminarFila(index)} disabled={isLoading}>
                        <i className="fas fa-trash-alt"></i>
                    </button>
                </td>
            )}
        </tr>
    );
});

FilaVariable.displayName = 'FilaVariable';