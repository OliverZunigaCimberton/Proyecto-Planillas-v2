// src/pages/login.jsx
import { useState } from 'react';
import { useAuth } from '../hooks/useauth';

// Importación unificada del logo desde su ubicación física real en el proyecto
import logoMain from '../styles/logos/login.png';

export const Login = () => {
    const { requestAccess, validateToken } = useAuth();
    
    const [step, setStep] = useState(1); 
    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState({ message: '', type: '' });

    const [emailHistory] = useState(() => {
        const saved = localStorage.getItem('sgp_historial_correos');
        return saved ? JSON.parse(saved) : [];
    });

    const showToast = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification({ message: '', type: '' }), 3500);
    };

    const handleRequestAccess = async (e) => {
        e.preventDefault();
        const cleanEmail = email.trim().toLowerCase();
        
        if (!cleanEmail) {
            showToast("Ingresa tu correo", "error");
            return;
        }

        setIsLoading(true);
        try {
            await requestAccess(cleanEmail);
            
            const rememberMe = document.getElementById('remember-me')?.checked;
            if (rememberMe) {
                localStorage.setItem('sgp_email_saved', cleanEmail);
                if (!emailHistory.includes(cleanEmail)) {
                    const newHistory = [...emailHistory, cleanEmail];
                    localStorage.setItem('sgp_historial_correos', JSON.stringify(newHistory));
                }
            } else {
                localStorage.removeItem('sgp_email_saved');
            }

            setStep(2);
            showToast("Código enviado a tu bandeja", "success");
        } catch (error) {
            showToast(error.message || "Error al solicitar acceso", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleValidateToken = (e) => {
        e.preventDefault();
        const cleanToken = token.trim();

        if (cleanToken.length !== 6) {
            showToast("El token debe ser de 6 dígitos", "error");
            return;
        }

        const isValid = validateToken(cleanToken);
        if (isValid) {
            showToast("Identidad validada", "success");
        } else {
            showToast("Código incorrecto", "error");
        }
    };

    return (
        <main className="main-wrapper">
            <div className="login-container">
                
                {/* Sección de Marca e Identidad Corporativa */}
                <section className="brand-section">
                    <div className="brand-content">
                        {/* Se vincula la imagen empaquetada modular por Vite */}
                        <img src={logoMain} alt="Logos Grupo Imberton" className="logo-main" />
                        <div className="brand-info">
                            <h1>GRUPO IMBERTON</h1>
                            <p>Portal de Planillas - Gestión Humana</p>
                            <div className="accent-line"></div>
                        </div>
                    </div>
                </section>

                {/* Sección del Formulario con Estética Fiel al Original */}
                <section className="form-section">
                    {step === 1 ? (
                        <div id="step-1" className="form-content">
                            <header>
                                <h2>Bienvenido</h2>
                                <p className="subtitle">Ingresa tu correo institucional</p>
                            </header>
                            <form onSubmit={handleRequestAccess} className="form-body">
                                <div className="input-group">
                                    <input 
                                        type="email" 
                                        id="email-user" 
                                        list="historial-correos" 
                                        required 
                                        autoComplete="off"
                                        className={email ? 'has-value' : ''}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={isLoading}
                                    />
                                    <datalist id="historial-correos">
                                        {emailHistory.map((item, idx) => (
                                            <option key={idx} value={item} />
                                        ))}
                                    </datalist>
                                    <label htmlFor="email-user">Correo Electrónico</label>
                                    <span className="input-bar"></span>
                                </div>
                                <div className="form-helpers">
                                    <label className="checkbox-wrapper">
                                        <input type="checkbox" id="remember-me" />
                                        <span className="checkmark"></span>
                                        Recordarme
                                    </label>
                                </div>
                                <button type="submit" id="btn-login" className="btn-login" disabled={isLoading}>
                                    {isLoading ? "VERIFICANDO..." : "SOLICITAR ACCESO"}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div id="step-2" className="form-content">
                            <header>
                                <h2>Verificación</h2>
                                <p className="subtitle">Ingresa el código enviado a tu bandeja</p>
                            </header>
                            <form onSubmit={handleValidateToken} className="form-body">
                                <div className="input-group">
                                    <input 
                                        type="text" 
                                        id="token-input" 
                                        required 
                                        maxLength={6} 
                                        className={token ? 'has-value' : ''}
                                        style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '1.5rem' }}
                                        value={token}
                                        onChange={(e) => setToken(e.target.value)}
                                    />
                                    <label htmlFor="token-input" style={{ width: '100%', textAlign: 'center' }}>
                                        Token de 6 dígitos
                                    </label>
                                    <span className="input-bar"></span>
                                </div>
                                <button type="submit" id="btn-valida-token" className="btn-login">
                                    VALIDAR IDENTIDAD
                                </button>
                                <p 
                                    onClick={() => setStep(1)} 
                                    style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.8rem', color: 'var(--gris-texto-p)', cursor: 'pointer' }}
                                >
                                    ¿Correo incorrecto? Regresar
                                </p>
                            </form>
                        </div>
                    )}
                </section>
            </div>

            {/* Contenedor Toast Embebido */}
            {notification.message && (
                <div id="notif-container">
                    <div className={`toast-notif ${notification.type}`}>
                        {notification.message}
                    </div>
                </div>
            )}
        </main>
    );
};