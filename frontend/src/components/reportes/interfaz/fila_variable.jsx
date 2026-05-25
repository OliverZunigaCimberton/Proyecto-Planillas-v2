// src/components/reportes/modal_maestro/subcomponentes/interfaz/fila_variable.jsx
import { memo } from 'react';
import { SmartAutocomplete } from '../../shared/smartdropdown';

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
    return (
        <tr>
            <td>
                <input 
                    type="text" 
                    className="smart-input" 
                    style={{ textAlign: 'center' }} 
                    value={linea.codigo_empleado} 
                    disabled={isReadOnly || isLoading || isTiempoAgotado} 
                    onChange={(e) => onChangeLinea(index, 'codigo_empleado', e.target.value)} 
                    onBlur={(e) => onBlurEmpleado(index, e.target.value)}
                />
            </td>
            <td className="cell-ro font-bold" style={{ textAlign: 'left', paddingLeft: '10px' }}>{linea.empleado_nombre}</td>
            <td className="cell-ro" style={{ textAlign: 'left', paddingLeft: '10px' }}>{linea.empleado_puesto}</td>
            <td>
                <SmartAutocomplete 
                    placeholder="" 
                    data={catalogos.variables} 
                    displayKey="codigo_variable"
                    searchKeys={['codigo_variable', 'nombre_variable']} 
                    value={linea.codigo_variable} 
                    disabled={isReadOnly || isLoading || isTiempoAgotado}
                    onSelect={(item) => {
                        onChangeLinea(index, 'id_variable', item.id);
                        onChangeLinea(index, 'codigo_variable', item.codigo_variable);
                        onChangeLinea(index, 'nombre_variable', item.nombre_variable);
                    }}
                />
            </td>
            <td className="cell-ro" style={{ textAlign: 'left', paddingLeft: '10px' }}>{linea.nombre_variable}</td>
            <td className="bg-gray">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--vino)' }}>
                    <span>$</span>
                    <input 
                        type="text" 
                        className="smart-input font-bold text-vino" 
                        style={{ background: 'transparent', border: 'none' }} 
                        value={linea.monto} 
                        disabled={isReadOnly || isLoading || isTiempoAgotado} 
                        onChange={(e) => onChangeLinea(index, 'monto', e.target.value)} 
                        onBlur={() => onBlurMonto(index)} 
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