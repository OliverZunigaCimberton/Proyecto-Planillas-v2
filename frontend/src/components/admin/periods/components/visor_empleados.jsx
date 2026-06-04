import { useState } from 'react';
import styles from '../styles/periodos.module.css';

/**
 * Subcomponente especializado para la visualización detallada de la nómina quincenal.
 * Permite filtrar colaboradores, incorporar altas manuales y remover registros específicos.
 */
export const VisorEmpleados = ({ 
    periodo, 
    empleados = [], 
    isLoading, 
    handleAgregarManual, 
    handleEliminarManual 
}) => {
    const [nuevoEmp, setNuevoEmp] = useState({ codigo_empleado: '', nombres_apellidos: '', puesto: '', empresa: '' });
    const [busqueda, setBusqueda] = useState('');
    const [errorValidacion, setErrorValidacion] = useState(false);
    const [empleadoSeleccionadoEliminar, setEmpleadoSeleccionadoEliminar] = useState(null);

    const submitManual = (e) => {
        e.preventDefault();
        // Validación preventiva antes de disparar el pipeline de persistencia
        if (!nuevoEmp.codigo_empleado || !nuevoEmp.nombres_apellidos) {
            setErrorValidacion(true);
            setTimeout(() => setErrorValidacion(false), 4000);
            return;
        }
        setErrorValidacion(false);
        handleAgregarManual(nuevoEmp, () => {
            // Callback de éxito: Limpieza de inputs locales
            setNuevoEmp({ codigo_empleado: '', nombres_apellidos: '', puesto: '', empresa: '' });
        });
    };

    // Filtro reactivo combinando código de empleado y coincidencia de nombres
    const empleadosFiltrados = empleados.filter(emp => {
        const termino = busqueda.toLowerCase().trim();
        if (!termino) return true;
        return String(emp.codigo_empleado).toLowerCase().includes(termino) ||
               String(emp.nombres_apellidos).toLowerCase().includes(termino);
    });

    // Cierre o bloqueo condicional estricto por estado maestro del periodo
    const isPeriodoBloqueado = periodo?.estado === 'CERRADO' || periodo?.estado === 'INACTIVO';

    return (
        <div className={styles.adminPersonalContainer}>
            
            {/* FILA 1: BARRA DE BÚSQUEDA Y METRICAS */}
            <div className={styles.adminPersonalActionsRow}>
                <div className={styles.adminPersonalSearchWrapper}>
                    <i className={`fas fa-search ${styles.adminPersonalSearchIcon}`}></i>
                    <input 
                        type="text" 
                        className={styles.adminPersonalSearchInput} 
                        placeholder="Buscar por código o nombre..." 
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        autoComplete="off"
                    />
                </div>
                <small className={styles.adminPersonalCounterLbl}>
                    Registros en pantalla: <strong className={styles.adminPersonalCounterTotal}>{empleadosFiltrados.length} colaboradores</strong>
                </small>
            </div>

            {/* FILA 2: FORMULARIO DE ALTA MANUAL COALINEADO */}
            {!isPeriodoBloqueado && (
                <form onSubmit={submitManual} className={styles.adminPersonalFormInline}>
                    <div className={styles.adminPersonalInputGroup} style={{ width: '12%' }}>
                        <label htmlFor="manual-codigo" className={styles.adminPersonalLabel}>CÓDIGO:</label>
                        <input id="manual-codigo" type="number" className={styles.adminPersonalInput} value={nuevoEmp.codigo_empleado} onChange={e => setNuevoEmp({...nuevoEmp, codigo_empleado: e.target.value})} disabled={isLoading} autoComplete="off" />
                    </div>
                    <div className={styles.adminPersonalInputGroup} style={{ width: '40%' }}>
                        <label htmlFor="manual-nombres" className={styles.adminPersonalLabel}>NOMBRES Y APELLIDOS:</label>
                        <input id="manual-nombres" type="text" className={styles.adminPersonalInput} value={nuevoEmp.nombres_apellidos} onChange={e => setNuevoEmp({...nuevoEmp, nombres_apellidos: e.target.value})} disabled={isLoading} autoComplete="off" />
                    </div>
                    <div className={styles.adminPersonalInputGroup} style={{ width: '30%' }}>
                        <label htmlFor="manual-puesto" className={styles.adminPersonalLabel}>PUESTO / CARGO:</label>
                        <input id="manual-puesto" type="text" className={styles.adminPersonalInput} value={nuevoEmp.puesto} onChange={e => setNuevoEmp({...nuevoEmp, puesto: e.target.value})} disabled={isLoading} autoComplete="off" />
                    </div>
                    <div className={styles.adminPersonalInputGroup} style={{ width: '12%' }}>
                        <label htmlFor="manual-empresa" className={styles.adminPersonalLabel}>EMPRESA:</label>
                        <input id="manual-empresa" type="text" className={styles.adminPersonalInput} value={nuevoEmp.empresa} onChange={e => setNuevoEmp({...nuevoEmp, empresa: e.target.value})} disabled={isLoading} autoComplete="off" />
                    </div>
                    <div className={styles.adminPersonalBtnSubmitWrap}>
                        <button type="submit" className={`btn-pri ${styles.adminPersonalBtnSubmit}`} title="Agregar Empleado" disabled={isLoading}>
                            <i className="fas fa-plus"></i>
                        </button>
                    </div>

                    {errorValidacion && (
                        <div className={styles.adminPersonalValidationNotice}>
                            <i className="fas fa-exclamation-circle"></i> Código y Nombre completo son obligatorios.
                        </div>
                    )}
                </form>
            )}

            {/* TABLA DE PERSONAL MAESTRO (CON SCROLL INJECTADO) */}
            <div className={`table-scroll ${styles.adminPersonalTableScroll}`}>
                <table className={`tabla-historial ${styles.adminPersonalTable}`}>
                    <thead className={styles.adminPersonalThead}>
                        <tr>
                            <th className={styles.adminPersonalTh1}>CÓDIGO EMPLEADO</th>
                            <th className={styles.adminPersonalTh2}>NOMBRES Y APELLIDOS</th>
                            <th className={styles.adminPersonalTh3}>PUESTO</th>
                            <th className={styles.adminPersonalTh4}>EMPRESA ASIGNADA</th>
                            <th className={styles.adminPersonalTh5}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {empleadosFiltrados.length === 0 ? (
                            <tr>
                                <td colSpan={5} className={`text-center p-25 text-muted ${styles.adminPersonalEmptyState}`}>
                                    No hay empleados registrados en este periodo contable.
                                </td>
                            </tr>
                        ) : (
                            empleadosFiltrados.map(emp => (
                                <tr key={emp.codigo_empleado} className={styles.adminPersonalTrBg}>
                                    <td className={styles.adminPersonalTdCode}><strong>{emp.codigo_empleado}</strong></td>
                                    <td className={styles.adminPersonalTdName}>{emp.nombres_apellidos}</td>
                                    <td className={styles.adminPersonalTdPost}>{emp.puesto || 'N/A'}</td>
                                    <td className={styles.adminPersonalTdCompany}>{emp.empresa || 'GRUPO IMBERTON'}</td>
                                    <td className={styles.adminPersonalTdDel}>
                                        {!isPeriodoBloqueado && (
                                            <button 
                                                type="button" 
                                                className={styles.adminPersonalBtnDel} 
                                                onClick={() => setEmpleadoSeleccionadoEliminar(emp)} 
                                                disabled={isLoading}
                                            >
                                                <i className="fas fa-trash-alt"></i>
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* SUB-MODAL LOCAL: Confirmación de Baja Individual */}
            {empleadoSeleccionadoEliminar && (
                <div className={styles.adminConfirmOverlay}>
                    <div className={`modal-content glass-card-formulario modal-sm text-center ${styles.adminConfirmContent}`}>
                        <h3 className={`modal-title-warning ${styles.adminConfirmTitle}`} style={{ color: 'var(--vino)' }}>
                            <i className="fas fa-user-minus"></i> Remover Registro
                        </h3>
                        
                        <p className="modal-text-warning mt-10">
                            ¿Deseas remover a <strong>{empleadoSeleccionadoEliminar.nombres_apellidos}</strong> de la quincena actual?
                        </p>
                        
                        <div className={`modal-footer mt-20 ${styles.adminConfirmActions}`}>
                            <button 
                                type="button" 
                                className={`btn-sec ${styles.adminConfirmBtnCancel}`} 
                                onClick={() => setEmpleadoSeleccionadoEliminar(null)}
                            >
                                Cancelar
                            </button>
                            <button 
                                type="button" 
                                className={`btn-pri ${styles.adminConfirmBtnAction}`} 
                                style={{ backgroundColor: 'var(--vino)', color: '#ffffff' }} 
                                onClick={() => { 
                                    const cod = empleadoSeleccionadoEliminar.codigo_empleado; 
                                    setEmpleadoSeleccionadoEliminar(null); 
                                    handleEliminarManual(cod); 
                                }}
                            >
                                REMOVER
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};