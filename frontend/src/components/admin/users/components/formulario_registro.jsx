import styles from '../styles/usuarios.module.css';

/**
 * Subcomponente especializado para la captura e ingreso de datos catastrales
 * de un usuario (creación o edición) dentro del submundo administrativo.
 */
export const FormularioRegistro = ({ 
    formData, 
    setFormData, 
    isEdit, 
    isLoading, 
    handleToggleModulo, 
    handleGuardar, 
    setView 
}) => {
    return (
        <div className="modal-body">
            {/* Fila de Código de Empleado y Estado Operativo */}
            <div className="form-row">
                <div className="form-group flex-1">
                    <label htmlFor="user-codigo-input">Código de Empleado:</label>
                    <input 
                        id="user-codigo-input"
                        type="number" 
                        className="m-input" 
                        placeholder="" 
                        value={formData.codigo} 
                        onChange={(e) => setFormData({ ...formData, codigo: e.target.value })} 
                        disabled={isEdit || isLoading} 
                        autoComplete="off"
                    />
                </div>
                <div className="form-group flex-1">
                    <label htmlFor="user-estado-select">Estado:</label>
                    <select 
                        id="user-estado-select"
                        className="m-input" 
                        value={formData.estado} 
                        onChange={(e) => setFormData({ ...formData, estado: e.target.value })} 
                        disabled={isLoading}
                    >
                        <option value="Activo">ACTIVO</option>
                        <option value="Inactivo">INACTIVO</option>
                    </select>
                </div>
            </div>
            
            {/* Campo de Nombre Completo */}
            <div className="form-group">
                <label htmlFor="user-nombre-input">Nombre Completo:</label>
                <input 
                    id="user-nombre-input"
                    type="text" 
                    className="m-input" 
                    placeholder="" 
                    value={formData.nombre} 
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} 
                    disabled={isLoading} 
                    autoComplete="off"
                />
            </div>
            
            {/* Campo de Correo Electrónico Institucional */}
            <div className="form-group">
                <label htmlFor="user-email-input">Correo Institucional:</label>
                <input 
                    id="user-email-input"
                    type="email" 
                    className="m-input" 
                    placeholder="" 
                    value={formData.email} 
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                    disabled={isLoading} 
                    autoComplete="off"
                />
            </div>
            
            {/* Selección de Rol del Perfil */}
            <div className="form-group">
                <label htmlFor="user-rol-select">Rol en el Sistema:</label>
                <select 
                    id="user-rol-select"
                    className="m-input" 
                    value={formData.rol} 
                    onChange={(e) => setFormData({ ...formData, rol: e.target.value })} 
                    disabled={isLoading}
                >
                    <option value="REPORTANTE">REPORTANTE</option>
                    <option value="AUTORIZADOR">AUTORIZADOR</option>
                    <option value="CONTADOR">CONTADOR</option>
                    <option value="ADMIN">ADMINISTRADOR</option>
                </select>
            </div>

            {/* Matriz Checkbox de Módulos Corporativos Habilitados */}
            <div className={`form-group ${styles.adminUserModulesBox}`}>
                <label className={styles.adminUserModulesLabel}>
                    <i className="fas fa-shield-alt"></i> MÓDULOS CON ACCESO:
                </label>
                <div className={styles.adminUserCheckboxRow}>
                    {['Variables', 'Horas Extras', 'Saldos'].map((modulo) => (
                        <label key={modulo} className={styles.adminUserCheckboxLbl}>
                            <input 
                                type="checkbox" 
                                checked={Array.isArray(formData.modulos) && formData.modulos.includes(modulo)}
                                onChange={() => handleToggleModulo(modulo)}
                                disabled={isLoading}
                            /> 
                            {modulo}
                        </label>
                    ))}
                </div>
            </div>

            {/* Panel Inferior de Acciones */}
            <div className={`modal-footer ${styles.adminUserFormFooter}`}>
                <button 
                    type="button" 
                    className="btn-sec" 
                    onClick={() => setView('LIST')} 
                    disabled={isLoading}
                >
                    CANCELAR
                </button>
                <button 
                    type="button" 
                    className="btn-pri" 
                    onClick={handleGuardar} 
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <i className="fas fa-spinner fa-spin"></i> PROCESANDO
                        </>
                    ) : (
                        "GUARDAR"
                    )}
                </button>
            </div>
        </div>
    );
};