// src/components/admin/logica/use_logica_usuarios.js
import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../services/api';

export const useLogicaUsuarios = () => {
    // ==========================================
    // 1. ESTADOS
    // ==========================================
    const [view, setView] = useState('LIST'); // 'LIST' | 'FORM'
    const [usuarios, setUsuarios] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [notificacion, setNotificacion] = useState({ mensaje: '', tipo: '' });

    const [isEdit, setIsEdit] = useState(false);
    const [formData, setFormData] = useState({
        codigo: '', nombre: '', email: '', rol: 'REPORTANTE', estado: 'Activo', modulos: []
    });

    const mostrarToast = (mensaje, tipo = 'success') => {
        setNotificacion({ mensaje, tipo });
        setTimeout(() => setNotificacion({ mensaje: '', tipo: '' }), 3500);
    };

    // ==========================================
    // 2. CARGA INICIAL
    // ==========================================
    const cargarUsuarios = useCallback(async () => {
        try {
            const result = await api.admin.getUsuarios();
            const dataRaw = result?.data;
            const finalData = (dataRaw && dataRaw.data && Array.isArray(dataRaw.data)) 
                ? dataRaw.data : (Array.isArray(dataRaw) ? dataRaw : (Array.isArray(result) ? result : []));
                
            setUsuarios(finalData);
        } catch (error) {
            console.error("Error al cargar usuarios:", error);
            mostrarToast("Error al cargar datos", "error");
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => { cargarUsuarios(); }, 0);
        return () => clearTimeout(timer);
    }, [cargarUsuarios]);

    // ==========================================
    // 3. FLUJOS DE NAVEGACIÓN Y APERTURA
    // ==========================================
    const handleNuevoUsuario = () => {
        setIsEdit(false);
        setFormData({ codigo: '', nombre: '', email: '', rol: 'REPORTANTE', estado: 'Activo', modulos: [] });
        setView('FORM');
    };

    const handleEditarUsuario = async (codigo) => {
        setIsLoading(true);
        try {
            const result = await api.admin.getUsuarioById(codigo);
            const u = result?.data?.data || result?.data || result;
            
            if (u && (u.codigo !== undefined || u.email)) {
                setIsEdit(true);
                setFormData({
                    codigo: u.codigo ?? '', nombre: u.nombre ?? '', email: u.email ?? '',
                    rol: u.rol ?? 'REPORTANTE', estado: u.estado ?? 'Activo',
                    modulos: Array.isArray(u.modulos) ? u.modulos : []
                });
                setView('FORM');
            }
        } catch (error) {
            console.error("Error al cargar el usuario:", error);
            mostrarToast("Error al cargar el usuario", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleModulo = (modulo) => {
        setFormData(prev => {
            const modulosActuales = Array.isArray(prev.modulos) ? prev.modulos : [];
            const tieneModulo = modulosActuales.includes(modulo);
            return {
                ...prev,
                modulos: tieneModulo ? modulosActuales.filter(m => m !== modulo) : [...modulosActuales, modulo]
            };
        });
    };

    // ==========================================
    // 4. GUARDADO EN BASE DE DATOS
    // ==========================================
    const handleGuardar = async () => {
        if (!formData.codigo || !formData.nombre || !formData.email) {
            mostrarToast("Completa los campos obligatorios", "error");
            return;
        }

        setIsLoading(true);
        const payload = {
            codigo: parseInt(formData.codigo, 10), 
            nombre: formData.nombre.trim(), 
            email: formData.email.trim(),
            rol: formData.rol, 
            estado: formData.estado, 
            modulos: Array.isArray(formData.modulos) ? formData.modulos : []
        };

        try {
            if (isEdit) {
                const res = await api.admin.actualizarUsuario(payload.codigo, { payload });
                
                // ✨ VALIDACIÓN CLAVE: Si el backend reporta un fallo, detenemos el flujo y lanzamos el error
                if (res.error || res.success === false) {
                    throw new Error(res.error || "No se pudo actualizar el usuario.");
                }
                mostrarToast("Usuario actualizado con éxito", "success");
            } else {
                const res = await api.admin.guardarUsuario({ payload });
                
                // ✨ VALIDACIÓN CLAVE: Si el código o correo ya existen, atrapamos el mensaje personalizado del backend
                if (res.error || res.success === false) {
                    throw new Error(res.error || "No se pudo registrar el usuario.");
                }
                mostrarToast("Usuario registrado con éxito", "success");
            }
            setView('LIST');
            cargarUsuarios();
        } catch (error) {
            console.error("Error guardando usuario:", error);
            // El catch ahora recibirá el mensaje limpio ("El correo electrónico ya se encuentra registrado...") y lo pintará en rojo
            mostrarToast(error.message || "Error al procesar la solicitud", "error");
        } finally {
            setIsLoading(false);
        }
    };

    // ==========================================
    // 5. FILTROS DINÁMICOS
    // ==========================================
    const usuariosFiltrados = usuarios.filter(u => {
        if (!u) return false;
        const termino = searchTerm.toLowerCase();
        return (
            String(u.codigo || '').includes(termino) ||
            (u.nombre || '').toLowerCase().includes(termino) ||
            (u.email || '').toLowerCase().includes(termino)
        );
    });

    return {
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
    };
};