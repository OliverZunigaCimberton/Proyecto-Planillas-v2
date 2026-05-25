// src/components/admin/usuarios/formulariousuario.jsx

export const FormularioUsuario = ({ 
    formData, setFormData, isEdit, isLoading, handleToggleModulo, handleGuardar, setView 
}) => {
    return (
        <div className="modal-body">
            <div className="form-row">
                <div className="form-group flex-1">
                    <label>Código de Empleado:</label>
                    <input type="number" className="m-input" placeholder="Ej: 1234" value={formData.codigo} onChange={(e) => setFormData({...formData, codigo: e.target.value})} disabled={isEdit || isLoading} />
                </div>
                <div className="form-group flex-1">
                    <label>Estado:</label>
                    <select className="m-input" value={formData.estado} onChange={(e) => setFormData({...formData, estado: e.target.value})} disabled={isLoading}>
                        <option value="Activo">ACTIVO</option>
                        <option value="Inactivo">INACTIVO</option>
                    </select>
                </div>
            </div>
            
            <div className="form-group">
                <label>Nombre Completo:</label>
                <input type="text" className="m-input" placeholder="Nombre Apellido" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} disabled={isLoading} />
            </div>
            
            <div className="form-group">
                <label>Correo Institucional:</label>
                <input type="email" className="m-input" placeholder="usuario@grupoimberton.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} disabled={isLoading} />
            </div>
            
            <div className="form-group">
                <label>Rol en el Sistema:</label>
                <select className="m-input" value={formData.rol} onChange={(e) => setFormData({...formData, rol: e.target.value})} disabled={isLoading}>
                    <option value="REPORTANTE">REPORTANTE</option>
                    <option value="AUTORIZADOR">AUTORIZADOR</option>
                    <option value="CONTADOR">CONTADOR</option>
                    <option value="ADMIN">ADMINISTRADOR</option>
                </select>
            </div>

            <div className="form-group" style={{ background: 'rgba(15, 23, 42, 0.05)', padding: '15px', borderRadius: '8px', marginTop: '5px' }}>
                <label style={{ marginBottom: '10px', display: 'block' }}><i className="fas fa-shield-alt"></i> MÓDULOS CON ACCESO:</label>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    {['Variables', 'Horas Extras', 'Saldos'].map(modulo => (
                        <label key={modulo} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '400', cursor: 'pointer' }}>
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

            <div className="modal-footer" style={{ marginTop: '20px' }}>
                <button className="btn-sec" onClick={() => setView('LIST')} disabled={isLoading}>CANCELAR</button>
                <button className="btn-pri" onClick={handleGuardar} disabled={isLoading}>
                    {isLoading ? <><i className="fas fa-spinner fa-spin"></i> PROCESANDO</> : "GUARDAR"}
                </button>
            </div>
        </div>
    );
};