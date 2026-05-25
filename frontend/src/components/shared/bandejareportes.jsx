// src/components/shared/bandejareportes.jsx
import { useAuth } from '../../hooks/useauth';

const formatearFecha = (fechaStr) => {
    if (!fechaStr) return "--/--/--";
    const [y, m, d] = fechaStr.split('T')[0].split('-');
    return `${d.substring(0, 2)}/${m}/${y.slice(-2)}`;
};

const formatoMoneda = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const BandejaReportes = ({ reportes, isLoading, onVerMas }) => {
    const { user } = useAuth();
    const rolActual = user?.rol?.toUpperCase() || 'REPORTANTE';

    return (
        <div className="glass-card">
            <div className="card-header-tray">
                <div className="col"># Reporte</div>
                <div className="col">Fecha Creación</div>
                <div className="col">Marca</div>
                <div className="col">Monto Total</div>
                <div className="col">Estado</div>
                <div className="col text-right">Acciones</div>
            </div>
            
            <div className="table-wrapper" style={{ height: 'calc(100vh - 280px)', overflowY: 'auto' }}>
                <table className="imberton-table" style={{ width: '100%' }}>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan="6" className="text-center p-80 text-muted">
                                    <i className="fas fa-spinner fa-spin"></i> Cargando reportes...
                                </td>
                            </tr>
                        ) : reportes.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="text-center p-80 text-muted" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px' }}>
                                    {rolActual === 'AUTORIZADOR' 
                                        ? 'No tienes reportes pendientes de revisar en esta bandeja.' 
                                        : 'No se encontraron registros de variables en este periodo.'}
                                </td>
                            </tr>
                        ) : (
                            reportes.map(r => {
                                const codigoUnico = `RV-${String(r.id).padStart(5, '0')}`;
                                
                                // Adaptación condicional de etiquetas de visualización según Rol
                                let estadoVisual = r.estado;
                                let claseBadge = 'ACTIVO';

                                if (rolActual === 'ADMIN') {
                                    // ✨ CORRECCIÓN: Actualizamos el estado esperado de la BD y la etiqueta visual
                                    if (r.estado === 'Validado y Enviado a Planillas') {
                                        estadoVisual = 'Pendiente de Revisión Planillas';
                                        claseBadge = 'INACTIVO';
                                    }
                                } else if (rolActual === 'CONTADOR') {
                                    if (r.estado === 'Autorizado y Enviado a Contabilidad') {
                                        estadoVisual = 'Pendiente de Validación';
                                        claseBadge = 'INACTIVO';
                                    }
                                }

                                if (r.estado === 'Denegado' || r.estado === 'Guardado en borrador') {
                                    claseBadge = 'INACTIVO';
                                }

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
                                        <td className="font-bold text-vino">$ {formatoMoneda.format(r.monto_total || 0)}</td>
                                        <td><span className={`badge ${claseBadge}`}>{estadoVisual}</span></td>
                                        <td className="text-right">
                                            <button className="btn-sec btn-sm" onClick={() => onVerMas(r)}>
                                                VER MÁS
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};