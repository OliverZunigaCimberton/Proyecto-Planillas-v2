// src/components/admin/periodos/gestionpersonal.jsx
import { useState } from 'react';

export const GestionPersonal = ({ periodo, empleados, isLoading, handleAgregarManual, handleEliminarEmpleadoManual }) => {
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

    const estilos = {
        container: {
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            padding: '4px 24px 24px 24px', 
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            backgroundColor: '#ffffff',
            boxSizing: 'border-box'
        },
        actionsRow: {
            display: 'flex',
            gap: '12px',
            width: '100%',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '2px'
        },
        searchWrapper: {
            position: 'relative',
            width: '360px',
            display: 'flex',
            alignItems: 'center'
        },
        searchIcon: {
            position: 'absolute',
            left: '12px',
            color: '#64748b',
            fontSize: '13px'
        },
        searchInput: {
            width: '100%',
            height: '34px',
            padding: '0 12px 0 34px',
            fontSize: '12.5px',
            color: '#334155',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '5px',
            outline: 'none',
            boxSizing: 'border-box'
        },
        formInline: {
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-end',
            background: '#ffffff',
            padding: '10px 14px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            width: '100%',
            boxSizing: 'border-box',
            position: 'relative'
        },
        group: {
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
        },
        label: {
            fontSize: '10px',
            fontWeight: '700',
            color: '#475569',
            textTransform: 'uppercase',
            letterSpacing: '0.3px'
        },
        input: {
            height: '34px',
            padding: '0 10px',
            fontSize: '12.5px',
            color: '#334155',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '5px',
            outline: 'none',
            boxSizing: 'border-box',
            width: '100%'
        },
        btnDel: {
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#cc0000',
            padding: '4px 8px',
            fontSize: '13px'
        },
        validationNotice: {
            position: 'absolute',
            bottom: '-16px',
            left: '14px',
            fontSize: '10.5px',
            color: '#cc0000',
            fontWeight: '600'
        }
    };

    return (
        <div style={estilos.container}>
            
            {/* FILA 1: BARRA DE BÚSQUEDA */}
            <div style={estilos.actionsRow}>
                <div style={estilos.searchWrapper}>
                    <i className="fas fa-search" style={estilos.searchIcon}></i>
                    <input 
                        type="text" 
                        style={estilos.searchInput} 
                        placeholder="Buscar por código o nombre..." 
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>
                <small style={{ color: '#64748b', fontSize: '12px' }}>
                    Registros en pantalla: <strong style={{ color: '#1e293b' }}>{empleadosFiltrados.length} colaboradores</strong>
                </small>
            </div>

            {/* FILA 2: FORMULARIO DE ALTA MANUAL COALINEADO */}
            {!isPeriodoBloqueado && (
                <form onSubmit={submitManual} style={estilos.formInline}>
                    <div style={{ ...estilos.group, width: '12%' }}>
                        <label style={estilos.label}>CÓDIGO:</label>
                        <input type="number" style={estilos.input} placeholder="" value={nuevoEmp.codigo_empleado} onChange={e => setNuevoEmp({...nuevoEmp, codigo_empleado: e.target.value})} disabled={isLoading} />
                    </div>
                    <div style={{ ...estilos.group, width: '40%' }}>
                        <label style={estilos.label}>NOMBRES Y APELLIDOS:</label>
                        <input type="text" style={estilos.input} placeholder="" value={nuevoEmp.nombres_apellidos} onChange={e => setNuevoEmp({...nuevoEmp, nombres_apellidos: e.target.value})} disabled={isLoading} />
                    </div>
                    <div style={{ ...estilos.group, width: '30%' }}>
                        <label style={estilos.label}>PUESTO / CARGO:</label>
                        <input type="text" style={estilos.input} placeholder="" value={nuevoEmp.puesto} onChange={e => setNuevoEmp({...nuevoEmp, puesto: e.target.value})} disabled={isLoading} />
                    </div>
                    <div style={{ ...estilos.group, width: '12%' }}>
                        <label style={estilos.label}>EMPRESA:</label>
                        <input type="text" style={estilos.input} placeholder="" value={nuevoEmp.empresa} onChange={e => setNuevoEmp({...nuevoEmp, empresa: e.target.value})} disabled={isLoading} />
                    </div>
                    <div style={{ width: '6%', display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" className="btn-pri" style={{ padding: '0', width: '100%', height: '34px', fontSize: '13px', fontWeight: '700', border: 'none', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Agregar Empleado" disabled={isLoading}>
                            <i className="fas fa-plus"></i>
                        </button>
                    </div>

                    {errorValidacion && (
                        <div style={estilos.validationNotice}>
                            <i className="fas fa-exclamation-circle"></i> Código y Nombre completo son obligatorios.
                        </div>
                    )}
                </form>
            )}

            {/* 🛠️ CONTENEDOR AJUSTADO A 330PX DE MAX-HEIGHT PARA EVITAR EL CORTE EN EL PIE DEL MODAL */}
            <div className="table-scroll" style={{ maxHeight: '330px', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '5px' }}>
                <table className="tabla-historial" style={{ margin: 0, width: '100%', tableLayout: 'fixed' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f8fafc' }}>
                        <tr>
                            <th style={{ width: '12%', textAlign: 'center', padding: '10px 0' }}>CÓDIGO EMPLEADO</th>
                            <th style={{ width: '40%', textAlign: 'left', paddingLeft: '12px' }}>NOMBRES Y APELLIDOS</th>
                            <th style={{ width: '30%', textAlign: 'left', paddingLeft: '12px' }}>PUESTO</th>
                            <th style={{ width: '12%', textAlign: 'center' }}>EMPRESA ASIGNADA</th>
                            <th style={{ width: '6%', textAlign: 'center' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {empleadosFiltrados.length === 0 ? (
                            <tr><td colSpan={5} className="text-center p-25 text-muted" style={{ fontSize: '13px', fontStyle: 'italic', backgroundColor: '#ffffff' }}>No hay empleados que coincidan con la vista.</td></tr>
                        ) : (
                            empleadosFiltrados.map(emp => (
                                <tr key={emp.codigo_empleado} style={{ backgroundColor: '#ffffff' }}>
                                    <td style={{ textAlign: 'center', fontSize: '12.5px', padding: '6px 0' }}><strong>{emp.codigo_empleado}</strong></td>
                                    <td style={{ textAlign: 'left', paddingLeft: '12px', fontSize: '12.5px', fontWeight: '600', color: '#1e293b', padding: '6px 12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.nombres_apellidos}</td>
                                    <td style={{ textAlign: 'left', paddingLeft: '12px', fontSize: '12.5px', color: '#475569', padding: '6px 12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.puesto || 'N/A'}</td>
                                    <td style={{ textAlign: 'center', color: '#64748b', fontSize: '12px', padding: '6px 0' }}>{emp.empresa || 'GRUPO IMBERTON'}</td>
                                    <td style={{ textAlign: 'center', padding: '6px 0' }}>
                                        {!isPeriodoBloqueado && (
                                            <button type="button" style={estilos.btnDel} onClick={() => setEmpleadoSeleccionadoEliminar(emp)} disabled={isLoading}>
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
                <div className="modal-overlay" style={{ display: 'flex', zIndex: 9999 }}>
                    <div className="modal-content glass-card-formulario modal-sm text-center">
                        <h3 className="modal-title-warning" style={{ color: '#cc0000' }}><i className="fas fa-user-minus"></i> Remover Registro</h3>
                        <p className="modal-text-warning mt-10">¿Deseas remover a <strong>{empleadoSeleccionadoEliminar.nombres_apellidos}</strong> de la quincena actual?</p>
                        <div className="modal-footer mt-20" style={{ display: 'flex', gap: '10px' }}>
                            <button type="button" className="btn-sec w-100" onClick={() => setEmpleadoSeleccionadoEliminar(null)}>Cancelar</button>
                            <button type="button" className="btn-pri w-100 btn-danger-solid" style={{ backgroundColor: '#cc0000', color: 'white', border: 'none' }} onClick={() => { const cod = empleadoSeleccionadoEliminar.codigo_empleado; setEmpleadoSeleccionadoEliminar(null); handleEliminarEmpleadoManual(cod); }}>Remover</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};