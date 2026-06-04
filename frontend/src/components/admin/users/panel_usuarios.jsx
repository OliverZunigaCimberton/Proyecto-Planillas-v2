import { ContenedorBase } from '../common/contenedor_base';
import { EncabezadoVista } from '../common/encabezado_vista';
import { TablaUsuarios } from './components/tabla_usuarios';
import { FormularioRegistro } from './components/formulario_registro';
import { useUsuarios } from './logic/use_usuarios';

/**
 * Componente raíz y orquestador del submundo de Usuarios.
 * Su función es alternar dinámicamente entre la vista de tabla (LIST) y 
 * la vista de formulario (FORM) aplicando un diseño consistente.
 */
export const PanelUsuarios = ({ onClose }) => {
    const {
        view,
        setView,
        searchTerm,
        setSearchTerm,
        isLoading,
        notificacion,
        isEdit,
        formData,
        setFormData,
        usuariosFiltrados,
        handleNuevoUsuario,
        handleEditarUsuario,
        handleToggleModulo,
        handleGuardar
    } = useUsuarios();

    // Abstracción limpia para configurar el encabezado según la pantalla activa
    const obtenerConfiguracionEncabezado = () => {
        if (view === 'LIST') {
            return {
                titulo: 'Usuarios del Sistema',
                icono: 'fas fa-users-cog',
                textoBoton: '+ NUEVO',
                mostrarBoton: true,
                onAccion: handleNuevoUsuario,
                onClose: onClose // Cierra por completo el panel de administración
            };
        }

        return {
            titulo: isEdit ? 'Editar Usuario' : 'Nuevo Usuario',
            icono: isEdit ? 'fas fa-user-edit' : 'fas fa-user-plus',
            textoBoton: '',
            mostrarBoton: false,
            onAccion: () => {},
            onClose: () => setView('LIST') // Regresa al listado al presionar la 'X' en el formulario
        };
    };

    const configEncabezado = obtenerConfiguracionEncabezado();

    return (
        <ContenedorBase vista={view}>
            {/* Encabezado dinámico adaptado al estado visual */}
            <EncabezadoVista 
                titulo={configEncabezado.titulo}
                icono={configEncabezado.icono}
                textoBoton={configEncabezado.textoBoton}
                mostrarBoton={configEncabezado.mostrarBoton}
                onAccion={configEncabezado.onAccion}
                onClose={configEncabezado.onClose}
            />
            
            {/* Renderizado condicional táctico */}
            {view === 'LIST' ? (
                <TablaUsuarios 
                    usuariosFiltrados={usuariosFiltrados}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    handleEditarUsuario={handleEditarUsuario}
                    isLoading={isLoading}
                />
            ) : (
                <FormularioRegistro 
                    formData={formData}
                    setFormData={setFormData}
                    isEdit={isEdit}
                    isLoading={isLoading}
                    handleToggleModulo={handleToggleModulo}
                    handleGuardar={handleGuardar}
                    setView={setView}
                />
            )}

            {/* Sistema de Alertas Toast local e independiente de este submundo */}
            {notificacion.mensaje && (
                <div id="notif-container" style={{ position: 'fixed', zIndex: 99999 }}>
                    <div className={`toast-notif ${notificacion.tipo}`}>
                        {notificacion.mensaje}
                    </div>
                </div>
            )}
        </ContenedorBase>
    );
};