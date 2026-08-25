// src/services/api.js

// Configuración profesional: usa variable de entorno en producción, 
// o localhost:3000 si estás en desarrollo local.
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = {
    auth: {
        // Vinculado al controlador único de inicio de sesión que genera el código OTP
        requestAccess: async (param) => {
            const correoVal = param?.correo || param?.email || (typeof param === 'string' ? param : '');
            try {
                const res = await fetch(`${BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: correoVal, correo: correoVal })
                });
                
                if (!res.ok) return { success: false, msg: 'Ruta de acceso no encontrada', data: {}, user: {} };
                return await res.json();
            } catch (e) {
                return { success: false, msg: e.message, data: {}, user: {} };
            }
        },
        login: async (param1, param2) => {
            const correoVal = param1?.correo || param1?.email || (typeof param1 === 'string' ? param1 : '');
            const tokenVal = param2 || param1?.token || '';
            try {
                const res = await fetch(`${BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: correoVal, correo: correoVal, token: tokenVal })
                });
                
                if (!res.ok) return { success: false, msg: 'Ruta de inicio no encontrada', data: {}, user: {} };
                return await res.json();
            } catch (e) {
                return { success: false, msg: e.message, data: {}, user: {} };
            }
        }
    },

    admin: {
        // ====================================================================
        // GESTIÓN DE PERIODOS
        // ====================================================================
        getPeriodos: async () => {
            const res = await fetch(`${BASE_URL}/admin/periodos`);
            return await res.json();
        },
        getPeriodoById: async (id) => {
            const res = await fetch(`${BASE_URL}/admin/periodo/${id}`); // Ajustado a singular
            return await res.json();
        },
        guardarPeriodo: async (payloadMasivo) => {
            const res = await fetch(`${BASE_URL}/admin/periodo`, { // Ajustado a singular
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payloadMasivo)
            });
            return await res.json();
        },
        actualizarPeriodo: async (id, payloadPlano) => {
            const res = await fetch(`${BASE_URL}/admin/periodo/${id}`, { // Ajustado a singular
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ payload: payloadPlano })
            });
            return await res.json();
        },
        getBandejaReportes: async (idPeriodo) => {
            const res = await fetch(`${BASE_URL}/admin/bandeja/${idPeriodo}`);
            return await res.json();
        },

        // ====================================================================
        // GESTIÓN DE PERSONAL ASOCIADO AL PERIODO
        // ====================================================================
        getEmpleadosByPeriodo: async (idPeriodo) => {
            const res = await fetch(`${BASE_URL}/admin/empleados/${idPeriodo}`); // Ajustado a ruta limpia
            return await res.json();
        },
        eliminarPersonalPeriodo: async (idPeriodo) => {
            const res = await fetch(`${BASE_URL}/admin/empleados/${idPeriodo}`, { // Ajustado a ruta limpia
                method: 'DELETE'
            });
            return await res.json();
        },
        agregarEmpleadoManual: async (payloadPlano) => {
            const res = await fetch(`${BASE_URL}/admin/empleado-manual`, { // Ajustado a singular
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ payload: payloadPlano })
            });
            return await res.json();
        },
        eliminarEmpleadoManual: async (idPeriodo, codigoEmpleado) => {
            const res = await fetch(`${BASE_URL}/admin/empleado/${idPeriodo}/${codigoEmpleado}`, { // Ajustado a singular
                method: 'DELETE'
            });
            return await res.json();
        },

        // ====================================================================
        // GESTIÓN DE USUARIOS
        // ====================================================================
        getUsuarios: async () => {
            const res = await fetch(`${BASE_URL}/admin/usuarios`);
            return await res.json();
        },
        getUsuarioById: async (codigo) => {
            const res = await fetch(`${BASE_URL}/admin/usuario/${codigo}`); // Ajustado a singular
            return await res.json();
        },
        guardarUsuario: async (payloadWrapper) => {
            const res = await fetch(`${BASE_URL}/admin/usuario`, { // Ajustado a singular
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payloadWrapper)
            });
            return await res.json();
        },
        actualizarUsuario: async (codigo, payloadWrapper) => {
            const res = await fetch(`${BASE_URL}/admin/usuario/${codigo}`, { // Ajustado a singular
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payloadWrapper)
            });
            return await res.json();
        },

        // ====================================================================
        // TIEMPO DE GRACIA / EXCEPCIONES
        // ====================================================================
        getExcepciones: async () => {
            const res = await fetch(`${BASE_URL}/admin/excepciones`);
            return await res.json();
        },
        getExcepcionById: async (id) => {
            const res = await fetch(`${BASE_URL}/admin/excepcion/${id}`); // Ajustado a singular
            return await res.json();
        },
        guardarExcepcion: async (payloadPlano) => {
            const res = await fetch(`${BASE_URL}/admin/excepcion`, { // Ajustado a singular
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payloadPlano)
            });
            return await res.json();
        },
        actualizarExcepcion: async (id, payloadPlano) => {
            const res = await fetch(`${BASE_URL}/admin/excepcion/${id}`, { // Ajustado a singular
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payloadPlano)
            });
            return await res.json();
        },

        // ====================================================================
        // INTEGRACIÓN REPORTE MAESTRO (ADMIN)
        // ====================================================================
        getInicial: async () => {
            const res = await fetch(`${BASE_URL}/shared/inicial`);
            return await res.json();
        },
        getReporteById: async (idReporte) => {
            const res = await fetch(`${BASE_URL}/admin/reporte/${idReporte}`);
            return await res.json();
        },
        recepcionar: async (id, payload) => {
            const res = await fetch(`${BASE_URL}/admin/recepcionar/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            return await res.json();
        },
        // ✨ AQUÍ PEGAS EL NUEVO FRAGMENTO:
        getExportacionMasiva: async (periodoId) => {
            const res = await fetch(`${BASE_URL}/admin/exportacion-masiva/${periodoId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            return await res.json();
        },

        // ====================================================================
        // CONFIGURACIONES GLOBALES (PANELES DEL ADMINISTRADOR)
        // ====================================================================
        actualizarPorcentajeCargo: async (nuevoPorcentaje) => {
            const res = await fetch(`${BASE_URL}/admin/porcentaje`, { // Redireccionado a la nueva ruta limpia
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nuevoPorcentaje })
            });
            return await res.json();
        },

        // CRUD MAESTRO DE MARCAS
        crearMarca: async (nombre_marca) => {
            const res = await fetch(`${BASE_URL}/admin/marcas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre_marca })
            });
            return await res.json();
        },
        actualizarMarca: async (id, nombre_marca) => {
            const res = await fetch(`${BASE_URL}/admin/marcas/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre_marca })
            });
            return await res.json();
        },
        eliminarMarca: async (id) => {
            const res = await fetch(`${BASE_URL}/admin/marcas/${id}`, { method: 'DELETE' });
            return await res.json();
        },

        // CRUD MAESTRO DE VARIABLES
        crearVariable: async (codigo_variable, nombre_variable) => {
            const res = await fetch(`${BASE_URL}/admin/variables`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codigo_variable, nombre_variable })
            });
            return await res.json();
        },
        actualizarVariable: async (id, codigo_variable, nombre_variable) => {
            const res = await fetch(`${BASE_URL}/admin/variables/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codigo_variable, nombre_variable })
            });
            return await res.json();
        },
        eliminarVariable: async (id) => {
            const res = await fetch(`${BASE_URL}/admin/variables/${id}`, { method: 'DELETE' });
            return await res.json();
        }
    },

    reportante: {
        getInicial: async () => {
            const res = await fetch(`${BASE_URL}/shared/inicial`); // Redireccionado a la capa compartida
            return await res.json();
        },
        getMisReportes: async (idPeriodo, codigoUsuario) => {
            const res = await fetch(`${BASE_URL}/reportante/mis-reportes/${idPeriodo}/${codigoUsuario}`);
            return await res.json();
        },
        getReporteById: async (idReporte) => {
            const res = await fetch(`${BASE_URL}/reportante/reporte/${idReporte}`);
            return await res.json();
        },
        verificarEmpleados: async (codigos, idPeriodo) => {
            const res = await fetch(`${BASE_URL}/shared/verificar-empleados`, { // Redireccionado a la capa compartida
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codigos, id_periodo: idPeriodo })
            });
            return await res.json();
        },
        getAutorizadorByCodigo: async (codigo) => {
            const res = await fetch(`${BASE_URL}/autorizador/menu-autorizador/${codigo}`); // Redireccionado a la ruta limpia del autorizador
            return await res.json();
        },
        uploadArchivo: async (payload) => {
            const res = await fetch(`${BASE_URL}/shared/upload`, { // Redireccionado a la capa compartida
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            return await res.json();
        },
        guardarReporte: async (payload) => {
            const res = await fetch(`${BASE_URL}/shared/guardar`, { // Redireccionado a la capa compartida
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            return await res.json();
        },
        cancelarEnvio: async (id) => {
            const res = await fetch(`${BASE_URL}/reportante/cancelar/${id}`, { method: 'PUT' });
            return await res.json();
        },
        eliminarBorrador: async (id) => {
            const res = await fetch(`${BASE_URL}/shared/eliminar/${id}`, { method: 'PUT' }); // Redireccionado a la capa compartida
            return await res.json();
        }
    },

    autorizador: {
        getInicial: async () => {
            const res = await fetch(`${BASE_URL}/shared/inicial`); // Redireccionado a la capa compartida
            return await res.json();
        },
        getBandeja: async (tipoBandeja, idPeriodo, codigoUsuario) => {
            const res = await fetch(`${BASE_URL}/autorizador/bandeja/${tipoBandeja}/${idPeriodo}/${codigoUsuario}`);
            return await res.json();
        },
        getReporteById: async (idReporte) => {
            const res = await fetch(`${BASE_URL}/autorizador/reporte/${idReporte}`);
            return await res.json();
        },
        actualizarEstado: async (id, payload) => {
            const res = await fetch(`${BASE_URL}/autorizador/cambiar-estado/${id}`, { // Redireccionado a la nueva ruta limpia
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            return await res.json();
        }
    },

    contador: {
        getInicial: async () => {
            const res = await fetch(`${BASE_URL}/shared/inicial`); // Redireccionado a la capa compartida
            return await res.json();
        },
        getBandeja: async (idPeriodo) => {
            const res = await fetch(`${BASE_URL}/contador/bandeja/${idPeriodo}`);
            return await res.json();
        },
        getReporteById: async (idReporte) => {
            const res = await fetch(`${BASE_URL}/contador/reporte/${idReporte}`);
            return await res.json();
        },
        contabilizar: async (id, payload) => {
            const res = await fetch(`${BASE_URL}/contador/contabilizar/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            return await res.json();
        }
    },

    shared: {
        getPeriodoActivo: async () => {
            try {
                const res = await fetch(`${BASE_URL}/admin/periodos`);
                if (!res.ok) return { success: false, data: null };
                
                const json = await res.json();
                const listaPeriodos = Array.isArray(json) ? json : (json.data || []);
                const periodoActivo = listaPeriodos.find(p => p.estado === 'ABIERTO');
                
                return { success: true, data: periodoActivo || null };
            } catch (error) {
                console.error("Error deduciendo periodo activo:", error);
                return { success: false, data: null };
            }
        },
        actualizarEstadoReporte: async (idReporte, payload) => {
            const res = await fetch(`${BASE_URL}/shared/reporte/${idReporte}/estado`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            return await res.json();
        },
        getExcepcionActiva: async (idPeriodo, codigoUsuario) => {
            try {
                const res = await fetch(`${BASE_URL}/shared/excepcion/${idPeriodo}/${codigoUsuario}`); // Redireccionado a la capa compartida
                const json = await res.json();
                if (json.success && json.data) {
                    return { data: json.data };
                }
                return { data: [] };
            } catch (error) {
                console.error("Error de conexión al buscar excepción:", error);
                return { data: [] };
            }
        }
    }
};