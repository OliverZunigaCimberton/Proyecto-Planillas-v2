// src/components/admin/modalusuarios.jsx

// Importación de Componentes Comunes y Vistas
import { Base } from './comunes/base';
import { Encabezado } from './comunes/encabezado';
import { ListaUsuarios } from './usuarios/listausuarios';
import { FormularioUsuario } from './usuarios/formulariousuario';

// Importación de la Lógica
import { useLogicaUsuarios } from './logica/use_logica_usuarios';

export const ModalUsuarios = ({ onClose }) => {
    
    // 🔌 Conexión con el Custom Hook
    const {
        view, setView,
        searchTerm, setSearchTerm,
        isLoading,
        notificacion,
        isEdit,
        formData, setFormData,
        usuariosFiltrados,
        handleNuevoUsuario,
        handleEditarUsuario,
        handleToggleModulo,
        handleGuardar
    } = useLogicaUsuarios();

    // ==========================================
    // RENDERIZADO DINÁMICO DEL ENCABEZADO
    // ==========================================
    const configEncabezado = {
        titulo: view === 'LIST' ? 'Usuarios' : (isEdit ? 'Editar Usuario' : 'Nuevo Usuario'),
        icono: view === 'LIST' ? 'fas fa-users-cog' : null,
        textoBoton: '+ NUEVO',
        mostrarBoton: view === 'LIST',
        onAccion: handleNuevoUsuario,
        onClose: view === 'LIST' ? onClose : () => setView('LIST')
    };

    return (
        <Base view={view}>
            {/* Encabezado Unificado */}
            <Encabezado {...configEncabezado} />

            {/* Vistas Renderizadas Condicionalmente */}
            {view === 'LIST' ? (
                <ListaUsuarios 
                    usuariosFiltrados={usuariosFiltrados} 
                    searchTerm={searchTerm} setSearchTerm={setSearchTerm} 
                    handleEditarUsuario={handleEditarUsuario} 
                    isLoading={isLoading} 
                />
            ) : (
                <FormularioUsuario 
                    formData={formData} setFormData={setFormData} 
                    isEdit={isEdit} isLoading={isLoading} 
                    handleToggleModulo={handleToggleModulo} 
                    handleGuardar={handleGuardar} setView={setView} 
                />
            )}

            {/* Alertas Toast */}
            {notificacion.mensaje && (
                <div id="notif-container" style={{ position: 'fixed', zIndex: 99999 }}>
                    <div className={`toast-notif ${notificacion.tipo}`}>{notificacion.mensaje}</div>
                </div>
            )}
        </Base>
    );
};

export default ModalUsuarios;