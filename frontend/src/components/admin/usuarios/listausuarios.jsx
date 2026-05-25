// src/components/admin/usuarios/listausuarios.jsx

export const ListaUsuarios = ({ 
    usuariosFiltrados, searchTerm, setSearchTerm, handleEditarUsuario, isLoading 
}) => {
    return (
        <>
            <div style={{ padding: '0 20px 15px 20px' }}>
                <div className="search-container" style={{ position: 'relative' }}>
                    <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--gris-texto)' }}></i>
                    <input 
                        type="text" 
                        className="m-input" 
                        placeholder="Buscar por código, nombre o correo..." 
                        style={{ width: '100%', paddingLeft: '35px' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        disabled={isLoading}
                    />
                </div>
            </div>

            <div className="table-scroll">
                <table className="tabla-historial">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Nombre Completo</th>
                            <th>Correo</th>
                            <th>Rol</th>
                            <th>Estado</th>
                            <th style={{ textAlign: 'center' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usuariosFiltrados.length === 0 ? (
                            <tr><td colSpan="6" className="text-center p-20 text-muted">No se encontraron usuarios.</td></tr>
                        ) : (
                            usuariosFiltrados.map(u => (
                                <tr key={u.codigo || u.email}>
                                    <td className="font-bold">{u.codigo || '-'}</td>
                                    <td>{u.nombre || <span className="text-muted italic">Sin nombre</span>}</td>
                                    <td>{u.email || '-'}</td>
                                    <td><span className="badge" style={{ background: '#e2e8f0', color: '#475569' }}>{u.rol || 'REPORTANTE'}</span></td>
                                    <td>
                                        <span className={`badge ${(u.estado || 'Activo').toLowerCase() === 'activo' ? 'ACTIVO' : 'INACTIVO'}`}>
                                            {(u.estado || 'Activo').toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button className="btn-sec btn-sm" onClick={() => handleEditarUsuario(u.codigo)} disabled={isLoading || !u.codigo}>
                                            <i className="fas fa-edit"></i> EDITAR
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
};