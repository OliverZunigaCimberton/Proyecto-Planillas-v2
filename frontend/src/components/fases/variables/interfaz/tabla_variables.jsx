// src/components/reportes/modal_maestro/subcomponentes/interfaz/tabla_variables.jsx
import { FilaVariable } from './fila_variable';

export const TablaVariables = ({ 
    lineas, 
    isReadOnly, 
    isLoading, 
    isTiempoAgotado, 
    catalogos, 
    cargoAMarca, // "Si" o "No"
    subtotal, 
    montoCargoMarca, 
    totalGeneral, 
    formatoMoneda,
    onChangeLinea, 
    onBlurEmpleado, 
    onBlurMonto, 
    onEliminarFila
}) => {

    // 🧠 DEDUCCIÓN CRONOLÓGICA: Deducimos el porcentaje real dividiendo el recargo histórico entre el subtotal
    let porcentajeTexto = '17.25%';
    if (subtotal > 0 && montoCargoMarca > 0) {
        porcentajeTexto = `${((montoCargoMarca / subtotal) * 100).toFixed(2)}%`;
    } else {
        const porcentajeValor = catalogos?.porcentajeCargoMarca !== undefined ? catalogos.porcentajeCargoMarca : catalogos?.porcentaje;
        if (porcentajeValor) {
            porcentajeTexto = `${(parseFloat(porcentajeValor) * 100).toFixed(2)}%`;
        }
    }

    return (
        <table className="reporte-detalle-table">
            <thead>
                <tr>
                    <th className="col-codigo">CÓDIGO</th>
                    <th className="col-nombre">NOMBRE</th>
                    <th className="col-puesto">PUESTO</th>
                    <th className="col-codigo-var">CÓDIGO VARIABLE</th>
                    <th className="col-nombre-var">NOMBRE VARIABLE</th>
                    <th className="col-monto">MONTO</th>
                    {!isReadOnly && !isTiempoAgotado && <th className="col-acciones-var"></th>}
                </tr>
            </thead>
            <tbody>
                {lineas.map((linea, index) => (
                    <FilaVariable 
                        key={linea.id_temp}
                        linea={linea}
                        index={index}
                        isReadOnly={isReadOnly}
                        isLoading={isLoading}
                        isTiempoAgotado={isTiempoAgotado}
                        catalogos={catalogos}
                        onChangeLinea={onChangeLinea}
                        onBlurEmpleado={onBlurEmpleado}
                        onBlurMonto={onBlurMonto}
                        onEliminarFila={onEliminarFila}
                    />
                ))}

                {/* Espaciador */}
                <tr>
                    <td colSpan={!isReadOnly && !isTiempoAgotado ? 7 : 6} style={{ height: '15px', border: 'none', background: 'transparent' }}></td>
                </tr>
                
                {/* Renderizado Condicional de Totales */}
                {cargoAMarca === 'Si' ? (
                    <>
                        <tr>
                            <td colSpan="3" style={{ border: 'none', background: 'transparent' }}></td>
                            <td colSpan="2" style={{ background: '#cc0000', color: '#ffffff', fontWeight: 'bold', textAlign: 'center', padding: '8px', border: '1px solid #cc0000', fontSize: '12px' }}>SUB TOTAL</td>
                            <td style={{ textAlign: 'right', fontWeight: 'bold', padding: '8px', background: '#ffffff', border: '1px solid #cc0000', color: '#cc0000', paddingRight: '12px', fontSize: '12px' }}>$ {formatoMoneda.format(subtotal)}</td>
                            {!isReadOnly && !isTiempoAgotado && <td style={{ border: 'none', background: 'transparent' }}></td>}
                        </tr>
                        <tr>
                            <td colSpan="3" style={{ border: 'none', background: 'transparent' }}></td>
                            <td colSpan="2" style={{ background: '#f59e0b', color: '#ffffff', fontWeight: 'bold', textAlign: 'center', padding: '8px', border: '1px solid #f59e0b', fontSize: '12px' }}>
                                {/* 🚀 Pintamos dinámicamente el valor configurado de la base de datos */}
                                MÁS CARGO A MARCA ({porcentajeTexto})
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 'bold', padding: '8px', background: '#ffffff', border: '1px solid #f59e0b', color: '#f59e0b', paddingRight: '12px', fontSize: '12px' }}>$ {formatoMoneda.format(montoCargoMarca)}</td>
                            {!isReadOnly && !isTiempoAgotado && <td style={{ border: 'none', background: 'transparent' }}></td>}
                        </tr>
                        <tr>
                            <td colSpan="3" style={{ border: 'none', background: 'transparent' }}></td>
                            <td colSpan="2" style={{ background: '#800020', color: '#ffffff', fontWeight: 'bold', textAlign: 'center', padding: '8px', border: '1px solid #800020', fontSize: '12px' }}>TOTAL REPORTE</td>
                            <td style={{ textAlign: 'right', fontWeight: 'bold', padding: '8px', background: '#ffffff', border: '1px solid #800020', color: '#800020', paddingRight: '12px', fontSize: '12px' }}>$ {formatoMoneda.format(totalGeneral)}</td>
                            {!isReadOnly && !isTiempoAgotado && <td style={{ border: 'none', background: 'transparent' }}></td>}
                        </tr>
                    </>
                ) : (
                    <tr>
                        <td colSpan="3" style={{ border: 'none', background: 'transparent' }}></td>
                        <td colSpan="2" style={{ background: '#cc0000', color: '#ffffff', fontWeight: 'bold', textAlign: 'center', padding: '8px', border: '1px solid #cc0000', fontSize: '12px' }}>TOTAL REPORTE</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold', padding: '8px', background: '#ffffff', border: '1px solid #cc0000', color: '#cc0000', paddingRight: '12px', fontSize: '12px' }}>$ {formatoMoneda.format(subtotal)}</td>
                        {!isReadOnly && !isTiempoAgotado && <td style={{ border: 'none', background: 'transparent' }}></td>}
                    </tr>
                )}
            </tbody>
        </table>
    );
};