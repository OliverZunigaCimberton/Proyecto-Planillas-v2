import styles from '../styles/usuarios.module.css';

/**
 * Subcomponente especializado encargado de renderizar el listado tabular de los usuarios
 * y gestionar la barra de filtrado reactivo del submundo.
 */
export const TablaUsuarios = ({ 
    usuariosFiltrados = [], 
    searchTerm, 
    setSearchTerm, 
    handleEditarUsuario, 
    isLoading 
}) => {
    return (
        <>
            {/* Barra de Búsqueda y Filtrado */}
            <div className={styles.adminUserSearchPadding}>
                <div className={`${styles.searchContainer} ${styles.adminUserSearchRelative}`}>
                    <i className={`fas fa-search ${styles.adminUserSearchIcon}`}></i>
                    <input 
                        type="text" 
                        className={`m-input ${styles.adminUserSearchInput}`} 
                        placeholder="Buscar por código, nombre o correo..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        disabled={isLoading}
                        autoComplete="off"
                    />
                </div>
            </div>

            {/* Contenedor de Tabla Historial con Scroll y Encabezado Fijo */}
            <div className={styles.adminUserTableContainer}>
                <div className={styles.adminUserTableScroll}>
                    <table className={`tabla-historial ${styles.adminUserTable}`}>
                        <thead className={styles.adminUserThead}>
                            <tr>
                            <th>Código</th>
                            <th>Nombre Completo</th>
                            <th>Correo</th>
                            <th>Rol</th>
                            <th>Estado</th>
                            <th className={styles.adminUserThCenter}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usuariosFiltrados.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="text-center p-20 text-muted">
                                    No se encontraron usuarios registrados.
                                </td>
                            </tr>
                        ) : (
                            usuariosFiltrados.map((usuario) => {
                                const tieneNombreValido = usuario.nombre?.trim();
                                const esEstadoActivo = (usuario.estado || 'Activo').toLowerCase() === 'activo';

                                return (
                                    <tr key={usuario.codigo || usuario.email}>
                                        <td className="font-bold">{usuario.codigo || '-'}</td>
                                        <td>
                                            {tieneNombreValido ? (
                                                usuario.nombre
                                            ) : (
                                                <span className="text-muted italic">Sin nombre registrado</span>
                                            )}
                                        </td>
                                        <td>{usuario.email || '-'}</td>
                                        <td>
                                            <span className={`badge ${styles.adminUserBadgeRole}`}>
                                                {usuario.rol || 'REPORTANTE'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${esEstadoActivo ? 'ACTIVO' : 'INACTIVO'}`}>
                                                {(usuario.estado || 'Activo').toUpperCase()}
                                            </span>
                                        </td>
                                        <td className={styles.adminUserTdCenter}>
                                            <button 
                                                type="button"
                                                className="btn-sec btn-sm" 
                                                onClick={() => handleEditarUsuario(usuario.codigo)} 
                                                disabled={isLoading || !usuario.codigo}
                                            >
                                                <i className="fas fa-edit"></i> EDITAR
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
        </>
    );
};