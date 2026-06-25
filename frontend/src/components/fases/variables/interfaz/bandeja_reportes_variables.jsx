// src/components/shared/bandejareportes.jsx
import { useAuth } from '../../../../hooks/useauth';

const formatearFecha = (fechaStr) => {
    if (!fechaStr) return "--/--/--";
    const [y, m, d] = fechaStr.split('T')[0].split('-');
    return `${d.substring(0, 2)}/${m}/${y.slice(-2)}`;
};

const formatoMoneda = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const BandejaReportesVariables = ({ reportes, isLoading, onVerMas }) => {
    const { user } = useAuth();
    const rolActual = user?.rol?.toUpperCase() || 'REPORTANTE';

    return (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="card-header-tray">
                <div className="col"># Reporte</div>
                <div className="col">Fecha Creación</div>
                <div className="col">Marca</div>
                <div className="col">Monto Total</div>
                <div className="col">Estado</div>
                <div className="col text-right">Acciones</div>
            </div>
            
            <div className="table-wrapper" style={{ height: 'calc(100vh - 280px)', overflowY: 'auto' }}>
                {/* 🚀 CONDICIONALES EXTRAÍDAS: Al usar DIVs directos liberamos al texto del colapso de la tabla */}
                {isLoading ? (
                    <div className="text-center text-muted" style={{ textAlign: 'center', padding: '80px 0', width: '100%' }}>
                        <i className="fas fa-spinner fa-spin"></i> Cargando reportes...
                    </div>
                ) : reportes.length === 0 ? (
                    <div className="text-center text-muted" style={{ textAlign: 'center', padding: '80px 0', width: '100%', fontSize: '14px' }}>
                        {rolActual === 'AUTORIZADOR' 
                            ? 'No tienes reportes pendientes de revisar en esta bandeja.' 
                            : 'No se encontraron registros de variables en este periodo.'}
                    </div>
                ) : (
                    <table className="imberton-table" style={{ width: '100%' }}>
                        <tbody>
                            {reportes.map(r => {
                                const codigoUnico = `RV-${String(r.id).padStart(5, '0')}`;
                                
                                // Adaptación condicional de etiquetas de visualización según Rol
                                let estadoVisual = r.estado;

                                if (rolActual === 'ADMIN') {
                                    if (r.estado === 'Validado y Enviado a Planillas') {
                                        estadoVisual = 'Pendiente de Revisión Planillas';
                                    }
                                } else if (rolActual === 'CONTADOR') {
                                    if (r.estado === 'Autorizado y Enviado a Contabilidad') {
                                        estadoVisual = 'Pendiente de Validación';
                                    }
                                }

                                // 🧠 LÓGICA DE NEGOCIO PURA DESDE EL BACKEND (CERO DATOS QUEMADOS)
                                const esCargoMarca = r.cargo_a_marca === 'Si';
                                const montoExhibir = esCargoMarca ? (r.subtotal || 0) : (r.monto_total || 0);

                                return (
                                    <tr key={r.id} style={{ 
                                        backgroundImage: 'linear-gradient(to right, rgba(148, 163, 184, 0) 0%, rgba(148, 163, 184, 0.6) 50%, rgba(148, 163, 184, 0) 100%)',
                                        backgroundPosition: 'bottom',
                                        backgroundSize: '100% 1px',
                                        backgroundRepeat: 'no-repeat'
                                    }}>
                                        <td className="font-bold text-dark">{codigoUnico}</td>
                                        <td>{formatearFecha(r.fecha_envio || r.fecha_creacion)}</td>
                                        <td>{r.marca || 'N/A'}</td>
                                        <td className="font-bold text-vino">$ {formatoMoneda.format(montoExhibir)}</td>
                                        {/* Se aplica un estilo en línea neutral para unificar todos los estatus en gris elegante */}
<td>
    <span 
        className="badge" 
        style={{ 
            backgroundColor: '#f1f5f9', // Fondo gris claro sutil
            color: '#475569',           // Texto gris oscuro corporativo
            border: '1px solid #cbd5e1', // Borde definido muy fino
            fontWeight: '700'
        }}
    >
        {estadoVisual}
    </span>
</td>
                                        <td className="text-right">
                                            <button className="btn-sec btn-sm" onClick={() => onVerMas(r)}>
                                                VER MÁS
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};