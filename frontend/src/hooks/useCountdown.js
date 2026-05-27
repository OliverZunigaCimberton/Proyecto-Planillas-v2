import { useState, useEffect } from 'react';

// 1. Extraemos la lógica pura fuera del hook para que no dependa del render de React
const getFormattedTime = (fecha, hora) => {
    if (!fecha || !hora) return 'ESPERANDO PERIODO...';
    
    const targetDate = new Date(`${fecha}T${hora}`).getTime();
    const now = new Date().getTime();
    const difference = targetDate - now;

    if (difference <= 0) return 'TIEMPO AGOTADO';

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
};

export const useCountdown = (fechaCorte, horaCorte) => {
    // 2. Inicialización perezosa (Lazy Init): Calcula el tiempo desde el primer milisegundo del render
    const [timeLeft, setTimeLeft] = useState(() => getFormattedTime(fechaCorte, horaCorte));

    useEffect(() => {
        // 3. Si no hay fechas, salimos limpiamente sin hacer setState síncrono
        if (!fechaCorte || !horaCorte) return;

        // 4. Micro-timeout (asíncrono) para evitar el error "set-state-in-effect" 
        // y actualizar el reloj instantáneamente si el usuario cambia de periodo.
        const timeoutId = setTimeout(() => {
            setTimeLeft(getFormattedTime(fechaCorte, horaCorte));
        }, 0);

        // 5. El intervalo regular de cada segundo (es asíncrono, por lo que React lo acepta perfectamente)
        const intervalId = setInterval(() => {
            setTimeLeft(getFormattedTime(fechaCorte, horaCorte));
        }, 1000);

        // Limpiamos la memoria
        return () => {
            clearTimeout(timeoutId);
            clearInterval(intervalId);
        };
    }, [fechaCorte, horaCorte]);

    return timeLeft;
};