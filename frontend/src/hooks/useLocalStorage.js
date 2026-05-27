import { useState } from 'react';

export const useLocalStorage = (key, initialValue) => {
    // Inicializamos el estado buscando primero si ya existe algo guardado en el navegador
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            // Si existe, lo parseamos (convertimos de texto a JSON). Si no, usamos el valor inicial.
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.warn(`Error leyendo localStorage clave "${key}":`, error);
            return initialValue;
        }
    });

    // Esta función envuelve a setStoredValue para que, además de cambiar el estado, guarde en memoria
    const setValue = (value) => {
        try {
            // Permitimos que 'value' sea una función (igual que en useState normal)
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            
            // Guardamos en el estado de React
            setStoredValue(valueToStore);
            
            // Guardamos físicamente en el navegador
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.warn(`Error guardando en localStorage clave "${key}":`, error);
        }
    };

    return [storedValue, setValue];
};