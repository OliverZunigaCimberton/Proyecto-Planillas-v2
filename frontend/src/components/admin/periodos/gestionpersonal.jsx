// src/components/admin/periodos/gestionpersonal.jsx
import { useState } from 'react';

export const GestionPersonal = ({ periodo, empleados, isLoading, handleAgregarManual, handleEliminarManual }) => {
    const [nuevoEmp, setNuevoEmp] = useState({ codigo_empleado: '', nombres_apellidos: '', puesto: '', empresa: '' });
    const [busqueda, setBusqueda] = useState('');
    const [errorValidacion, setErrorValidacion] = useState(false);
    const [empleadoSeleccionadoEliminar, setEmpleadoSeleccionadoEliminar] = useState(null);

    const submitManual = (e) => {
        e.preventDefault();
        if (!nuevoEmp.codigo_empleado || !nuevoEmp.nombres_apellidos) {
            setErrorValidacion(true);
            setTimeout(() => setErrorValidacion(false), 4000);
            return;
        }
        setErrorValidacion(false);
        handleAgregarManual(nuevoEmp, () => {
            setNuevoEmp({ codigo_empleado: '', nombres_apellidos: '', puesto: '', empresa: '' });
        });
    };

    const empleadosFiltrados = empleados.filter(emp => {
        const termino = busqueda.toLowerCase().trim();
        if (!termino) return true;
        return String(emp.codigo_empleado).toLowerCase().includes(termino) ||
               String(emp.nombres_apellidos).toLowerCase().includes(termino);
    });

    // 🛠️ ÚNICO CAMBIO: El periodo se bloquea exclusivamente si se marca como CERRADO (o INACTIVO).
    // Se mantiene la eliminación del cierre automático por validación de fecha.
    const isPeriodoBloqueado = periodo?.estado === 'CERRADO' || periodo?.estado === 'INACTIVO';

    return (
        <div className="admin-personal-container">
            
            {/* FILA 1: BARRA DE BÚSQUEDA */}
            <div className="admin-personal-actions-row">
                <div className="admin-personal-search-wrapper">
                    <i className="fas fa-search admin-personal-search-icon"></i>
                    <input 
                        type="text" 
                        className="admin-personal-search-input" 
                        placeholder="Buscar por código o nombre..." 
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>
                <small className="admin-personal-counter-lbl">
                    Registros en pantalla: <strong className="admin-personal-counter-total">{empleadosFiltrados.length} colaboradores</strong>
                </small>
            </div>

            {/* FILA 2: FORMULARIO DE ALTA MANUAL COALINEADO */}
            {!isPeriodoBloqueado && (
                <form onSubmit={submitManual} className="admin-personal-form-inline">
                    <div className="admin-personal-input-group" style={{ width: '12%' }}>
                        <label className="admin-personal-label">CÓDIGO:</label>
                        <input type="number" className="admin-personal-input" placeholder="" value={nuevoEmp.codigo_empleado} onChange={e => setNuevoEmp({...nuevoEmp, codigo_empleado: e.target.value})} disabled={isLoading} />
                    </div>
                    <div className="admin-personal-input-group" style={{ width: '40%' }}>
                        <label className="admin-personal-label">NOMBRES Y APELLIDOS:</label>
                        <input type="text" className="admin-personal-input" placeholder="" value={nuevoEmp.nombres_apellidos} onChange={e => setNuevoEmp({...nuevoEmp, nombres_apellidos: e.target.value})} disabled={isLoading} />
                    </div>
                    <div className="admin-personal-input-group" style={{ width: '30%' }}>
                        <label className="admin-personal-label">PUESTO / CARGO:</label>
                        <input type="text" className="admin-personal-input" placeholder="" value={nuevoEmp.puesto} onChange={e => setNuevoEmp({...nuevoEmp, puesto: e.target.value})} disabled={isLoading} />
                    </div>
                    <div className="admin-personal-input-group" style={{ width: '12%' }}>
                        <label className="admin-personal-label">EMPRESA:</label>
                        <input type="text" className="admin-personal-input" placeholder="" value={nuevoEmp.empresa} onChange={e => setNuevoEmp({...nuevoEmp, empresa: e.target.value})} disabled={isLoading} />
                    </div>
                    <div className="admin-personal-btn-submit-wrap">
                        <button type="submit" className="btn-pri admin-personal-btn-submit" title="Agregar Empleado" disabled={isLoading}>
                            <i className="fas fa-plus"></i>
                        </button>
                    </div>

                    {errorValidacion && (
                        <div className="admin-personal-validation-notice">
                            <i className="fas fa-exclamation-circle"></i> Código y Nombre completo son obligatorios.
                        </div>
                    )}
                </form>
            )}

            {/* 🛠️ CONTENEDOR AJUSTADO A 330PX DE MAX-HEIGHT PARA EVITAR EL CORTE EN EL PIE DEL MODAL */}
            <div className="table-scroll admin-personal-table-scroll">
                <table className="tabla-historial admin-personal-table">
                    <thead className="admin-personal-thead">
                        <tr>
                            <th className="admin-personal-th-1">CÓDIGO EMPLEADO</th>
                            <th className="admin-personal-th-2">NOMBRES Y APELLIDOS</th>
                            <th className="admin-personal-th-3">PUESTO</th>
                            <th className="admin-personal-th-4">EMPRESA ASIGNADA</th>
                            <th className="admin-personal-th-5"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {empleadosFiltrados.length === 0 ? (
                            <tr><td colSpan={5} className="text-center p-25 text-muted admin-personal-empty-state">No hay empleados que coincidan con la vista.</td></tr>
                        ) : (
                            empleadosFiltrados.map(emp => (
                                <tr key={emp.codigo_empleado} className="admin-personal-tr-bg">
                                    <td className="admin-personal-td-code"><strong>{emp.codigo_empleado}</strong></td>
                                    <td className="admin-personal-td-name">{emp.nombres_apellidos}</td>
                                    <td className="admin-personal-td-post">{emp.puesto || 'N/A'}</td>
                                    <td className="admin-personal-td-company">{emp.empresa || 'GRUPO IMBERTON'}</td>
                                    <td className="admin-personal-td-del">
                                        {!isPeriodoBloqueado && (
                                            <button type="button" className="admin-personal-btn-del" onClick={() => setEmpleadoSeleccionadoEliminar(emp)} disabled={isLoading}>
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

            {/* SUB-MODAL: Confirmación Eliminar Fila Individual */}
            {empleadoSeleccionadoEliminar && (
    <div className="admin-confirm-overlay">
        <div className="modal-content glass-card-formulario modal-sm text-center admin-confirm-content">
            <h3 className="modal-title-warning admin-confirm-title" style={{ color: '#800020' }}>
                <i className="fas fa-user-minus"></i> Remover Registro
            </h3>
            
            <p className="modal-text-warning mt-10">
                ¿Deseas remover a <strong>{empleadoSeleccionadoEliminar.nombres_apellidos}</strong> de la quincena actual?
            </p>
            
            <div className="modal-footer mt-20 admin-confirm-actions">
                <button type="button" className="btn-sec admin-confirm-btn-cancel" onClick={() => setEmpleadoSeleccionadoEliminar(null)}>
                    Cancelar
                </button>
                
                {/* 🚀 SOLUCIÓN DEFINITIVA: Se elimina 'btn-danger-solid' y se inyecta !important directo en el background-color */}
                <button 
                    type="button" 
                    className="btn-pri admin-confirm-btn-action" 
                    style={{ backgroundColor: '#800020 !important', color: '#ffffff !important' }} 
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