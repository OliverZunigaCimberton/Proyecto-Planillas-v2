// src/hooks/useauth.js
import { useContext } from 'react';
import { AuthContext } from '../context/authcontext'; // Apunta al archivo .js de manera transparente

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
    }
    return context;
};