// src/context/authprovider.jsx
import { useState, useEffect } from 'react';
import { AuthContext } from './authcontext';
import { api } from '../services/api';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedUser = sessionStorage.getItem('sgp_user_data');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return sessionStorage.getItem('sgp_token') === 'validated';
    });
    const [tempHash, setTempHash] = useState(null);

    useEffect(() => {
        if (isAuthenticated && user) {
            sessionStorage.setItem('sgp_token', 'validated');
            sessionStorage.setItem('sgp_user_data', JSON.stringify(user));
            localStorage.setItem('user_full_name', user.nombre);
            localStorage.setItem('user_role', user.rol);
            localStorage.setItem('user_code', user.codigo);
        } else {
            sessionStorage.clear();
            localStorage.removeItem('user_full_name');
            localStorage.removeItem('user_role');
            localStorage.removeItem('user_code');
        }
    }, [isAuthenticated, user]);

    const requestAccess = async (correo) => {
        try {
            const result = await api.auth.login(correo);
            const usuarioObj = result.usuario;
            
            // Guardamos el hash cifrado que generó el backend de forma segura
            setTempHash(result.otpHash);
            setUser(usuarioObj);

            return { success: true };
            
        } catch (error) {
            setTempHash(null);
            setUser(null);
            throw error;
        }
    };

    const validateToken = (inputToken) => {
        if (btoa(inputToken) === tempHash) {
            setIsAuthenticated(true);
            setTempHash(null);
            return true;
        }
        return false;
    };

    const logout = () => {
        setIsAuthenticated(false);
        setUser(null);
        setTempHash(null);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, requestAccess, validateToken, logout }}>
            {children}
        </AuthContext.Provider>
    );
};