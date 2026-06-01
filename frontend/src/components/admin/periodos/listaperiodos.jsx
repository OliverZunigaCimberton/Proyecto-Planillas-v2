// src/components/admin/periodos/listaperiodos.jsx

export const ListaPeriodos = ({ periodos, handleEditarPeriodo, handleGestionarPersonal, handlePrepararCierre, formatearFecha }) => {
    return (
        <div className="table-scroll admin-period-list-scroll">
            <table className="tabla-historial">
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Desde</th>
                        <th>Hasta</th>
                        <th>Corte de Variables</th>
                        <th>Estado Sistema</th>
                        <th className="admin-list-th-actions">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {periodos.length === 0 ? (
                        <tr><td colSpan="6" className="text-center p-20 text-muted">No hay periodos registrados.</td></tr>
                    ) : (
                        periodos.map(p => {
                            const isOpen = p.estado === 'ABIERTO' || p.estado === 'ACTIVO';
                            const badgeClass = isOpen ? 'ACTIVO' : 'INACTIVO';
                            const badgeText = isOpen ? 'ABIERTO' : 'CERRADO';

                            return (
                                <tr key={p.id} className="row-editable">
                                    <td><strong>{p.codigo_periodo}</strong></td>
                                    <td>{formatearFecha(p.fecha_desde)}</td>
                                    <td>{formatearFecha(p.fecha_hasta)}</td>
                                    <td>{formatearFecha(p.fecha_corte)}</td>
                                    <td><span className={`badge ${badgeClass}`}>{badgeText}</span></td>
                                    <td className="admin-list-td-actions">
                                        {isOpen && (
                                            <>
                                                <button className="btn-sec btn-sm admin-list-btn-edit" title="Editar fechas" onClick={() => handleEditarPeriodo(p.id)}>
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button className="btn-sec btn-sm admin-list-btn-lock" title="Cerrar periodo" onClick={() => handlePrepararCierre(p)}>
                                                    <i className="fas fa-lock"></i>
                                                </button>
                                            </>
                                        )}
                                        <button className="btn-sec btn-sm admin-list-btn-users" title="Gestionar personal" onClick={() => handleGestionarPersonal(p)}>
                                            <i className="fas fa-users"></i>
                                        </button>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
};