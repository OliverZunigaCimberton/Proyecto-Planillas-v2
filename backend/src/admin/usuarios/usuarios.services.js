// src/admin/usuarios/usuarios.services.js
const supabase = require('../../config/supabase');

/**
 * Registra un nuevo colaborador en el sistema y valida de forma segura que no existan duplicados críticos.
 * @param {Object} usuarioPayload - Contiene toda la información del nuevo usuario (nombre, email, código, rol, etc.)
 */
const registrarUsuario = async (usuarioPayload) => {
    const { error } = await supabase
        .from('usuarios')
        .insert([usuarioPayload]);

    if (error) {
        // Evaluamos si es un error de duplicidad en la base de datos (Código de error estándar 23505)
        if (error.code === '23505') {
            if (error.message?.includes('email') || error.details?.includes('email')) {
                throw new Error("El correo electrónico ya se encuentra registrado en el sistema.");
            } else {
                throw new Error("El código de empleado ya se encuentra asignado a otro usuario.");
            }
        }
        throw new Error(error.message || "Error interno al procesar el usuario.");
    }

    return { success: true, mensaje: "Usuario creado" };
};

/**
 * Modifica los datos de un usuario existente y evita que al actualizar se apropie del correo de otra persona.
 * @param {String|Number} codigoUsuario - El identificador único del colaborador a editar
 * @param {Object} usuarioPayload - Los nuevos datos corregidos
 */
const modificarUsuario = async (codigoUsuario, usuarioPayload) => {
    const { error } = await supabase
        .from('usuarios')
        .update(usuarioPayload)
        .eq('codigo', codigoUsuario);

    if (error) {
        // Evitamos choques de correos idénticos durante la edición
        if (error.code === '23505') {
            throw new Error("El correo electrónico ya está en uso por otro colaborador.");
        }
        throw new Error(error.message || "Error al actualizar los datos del usuario.");
    }

    return { success: true, mensaje: "Usuario actualizado" };
};

module.exports = {
    registrarUsuario,
    modificarUsuario
};