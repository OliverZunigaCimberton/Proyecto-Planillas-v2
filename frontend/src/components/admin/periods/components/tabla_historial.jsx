import styles from '../styles/periodos.module.css';

/**
 * Subcomponente especializado encargado de renderizar el historial contable 
 * de las quincenas/periodos registrados en el sistema y sus controles operativos.
 */
export const TablaHistorial = ({ 
    periodos = [], 
    handleEditarPeriodo, 
    handleGestionarPersonal, 
    handlePrepararCierre, 
    formatearFecha 
}) => {
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
                        <th className={styles.adminListThActions}>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {periodos.length === 0 ? (
                        <tr>
                            <td colSpan="6" className="text-center p-20 text-muted">
                                No se encontraron periodos quincenales registrados.
                            </td>
                        </tr>
                    ) : (
                        periodos.map((periodo) => {
                            const esPeriodoAbierto = periodo.estado === 'ABIERTO' || periodo.estado === 'ACTIVO';
                            const claseEtiqueta = esPeriodoAbierto ? 'ACTIVO' : 'INACTIVO';
                            const textoEtiqueta = esPeriodoAbierto ? 'ABIERTO' : 'CERRADO';

                            return (
                                <tr key={periodo.id} className="row-editable">
                                    <td><strong>{periodo.codigo_periodo}</strong></td>
                                    <td>{formatearFecha(periodo.fecha_desde)}</td>
                                    <td>{formatearFecha(periodo.fecha_hasta)}</td>
                                    <td>{formatearFecha(periodo.fecha_corte)}</td>
                                    <td>
                                        <span className={`badge ${claseEtiqueta}`}>
                                            {textoEtiqueta}
                                        </span>
                                    </td>
                                    <td className={styles.adminListTdActions}>
                                        {esPeriodoAbierto && (
                                            <>
                                                <button 
                                                    type="button"
                                                    className="btn-sec btn-sm" 
                                                    title="Editar fechas y parámetros" 
                                                    onClick={() => handleEditarPeriodo(periodo.id)}
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button 
                                                      type="button"
                                                     className="btn-sec btn-sm" 
                                                      title="Cerrar y sellar quincena" 
                                                      onClick={() => handlePrepararCierre(periodo)}
                                                 >
                                                     <i className="fas fa-lock"></i>
                                                 </button>
                                             </>
                                         )}
                                         <button 
                                              type="button"
                                             className="btn-sec btn-sm" 
                                              title="Gestionar personal maestro" 
                                              onClick={() => handleGestionarPersonal(periodo)}
                                         >
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