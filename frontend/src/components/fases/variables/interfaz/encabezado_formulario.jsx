// src/components/reportes/modal_maestro/subcomponentes/interfaz/encabezado_formulario.jsx
import { SmartAutocomplete } from '../../../shared/smartdropdown';
// 🚀 Importamos el componente desde la carpeta shared
import { CabeceraCorporativa } from '../../../shared/cabecera_corporativa';

export const EncabezadoFormulario = ({ 
    reporteHeader, 
    setReporteHeader, 
    periodoActivo, 
    catalogos, 
    isReadOnly, 
    isLoading, 
    isTiempoAgotado, 
    formatearFecha 
}) => {
    return (
        <div className="reporte-body-header">
            {/* 🚀 Invocamos la cabecera dinámica pasándole el título y el tamaño exclusivo de esta fase */}
            <CabeceraCorporativa 
                titulo="REPORTE DE COMISIONES, PREMIOS Y BONIFICACIONES" 
                altoLogos={48} 
            />
            
            <div className="reporte-header-grid">
                <div className="rh-group">
                    <label>PERIODO DE PLANILLA:</label>
                    <span className="rh-value">
                        {periodoActivo ? `${formatearFecha(periodoActivo.fecha_desde)} - ${formatearFecha(periodoActivo.fecha_hasta)}` : '--'}
                    </span>
                </div>
                
                <div className="rh-group">
                    <label>FECHA:</label>
                    <span className="rh-value">{reporteHeader.fecha}</span>
                </div>
                
                <div className="rh-group">
                    <label>MARCA:</label>
                    <SmartAutocomplete 
                        placeholder="Buscar marca..." 
                        data={catalogos.marcas} 
                        displayKey="nombre_marca"
                        value={reporteHeader.marca} 
                        disabled={isReadOnly || isLoading || isTiempoAgotado}
                        onSelect={(item) => setReporteHeader(prev => ({ ...prev, id_marca: item.id, marca: item.nombre_marca, hayCambios: true }))}
                    />
                </div>
                
                <div className="rh-group">
                    <label>CARGO A MARCA:</label>
                    <select 
                        className="smart-input" 
                        value={reporteHeader.cargo_a_marca} 
                        disabled={isReadOnly || isLoading || isTiempoAgotado} 
                        onChange={(e) => setReporteHeader(prev => ({ ...prev, cargo_a_marca: e.target.value, hayCambios: true }))}
                    >
                        <option value="" disabled>Seleccione...</option>
                        <option value="Si">Sí</option>
                        <option value="No">No</option>
                    </select>
                </div>

                <div className="rh-group" style={{ gridColumn: 'span 2', display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ width: '40%' }}>
                        <label>CENTRO DE COSTO:</label>
                        <SmartAutocomplete 
                            placeholder="Buscar Nomenclatura..." 
                            data={catalogos.centrosCosto} 
                            displayKey="nomenclatura_cc"
                            value={reporteHeader.centro_costo} 
                            disabled={isReadOnly || isLoading || isTiempoAgotado}
                            onSelect={(item) => {
                                setReporteHeader(prev => ({
                                    ...prev, 
                                    id_cc: item.id, 
                                    centro_costo: item.nomenclatura_cc,
                                    nombre_cc_descriptivo: item.nombre_cc || item.descripcion || '',
                                    hayCambios: true
                                }));
                            }}
                        />
                    </div>
                    <div style={{ width: '60%', paddingTop: '16px' }}>
                        <span className="rh-value" style={{ display: 'block', textAlign: 'left', background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', minHeight: '18px', fontSize: '12px', fontWeight: 'bold', color: '#334155' }}>
                            {reporteHeader.nombre_cc_descriptivo || ''}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};