// src/pages/seleccionapp.jsx
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useauth';

export const SeleccionApp = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Verificación de seguridad contra arreglos indefinidos
    const modulosPermitidos = user?.modulos || [];

    const handleNavigate = (modulo) => {
        if (modulo === 'Variables') {
            let rol = user?.rol?.toUpperCase() || '';
            
            // HOMOLOGACIÓN: Traduce los roles crudos de Supabase al estándar de rutas del Frontend
            if (rol === 'ADMINISTRACIÓN' || rol === 'ADMINISTRACION') rol = 'ADMIN';
            if (rol === 'REPORTERO') rol = 'REPORTANTE';

            switch (rol) {
                case 'ADMIN':
                    navigate('/adminvariables');
                    break;
                case 'REPORTANTE':
                    navigate('/reportantevariables');
                    break;
                case 'AUTORIZADOR':
                    navigate('/autorizadorvariables');
                    break;
                case 'CONTADOR':
                    navigate('/contadorvariables');
                    break;
                default:
                    alert(`Rol no configurado en el sistema: ${rol}`);
                    break;
            }
        } else {
            alert('Este módulo estará disponible en las próximas fases del proyecto.');
        }
    };

    return (
        <main className="main-wrapper">
            <div className="selection-container">
                
                <header className="selection-header">
                    <div className="user-welcome"></div>
                    <h2>Panel de Aplicaciones</h2>
                    <p id="user-role">
                        Bienvenido, <strong>{user?.nombre}</strong> ({user?.rol})
                    </p>
                    <div className="accent-line"></div>
                </header>

                <section className="apps-grid">
                    
                    {/* Tarjeta: Horas Extras (Dinámica) */}
                    {modulosPermitidos.includes('Horas Extras') && (
                        <div className="app-card disabled-card" onClick={() => handleNavigate('Horas Extras')}>
                            <div className="app-icon">
                                <i className="far fa-clock"></i>
                            </div>
                            <h3>Horas Extras</h3>
                            <p>Registro y control de tiempo adicional.</p>
                        </div>
                    )}

                    {/* Tarjeta: Variables (Dinámica) */}
                    {modulosPermitidos.includes('Variables') && (
                        <div className="app-card active-card" onClick={() => handleNavigate('Variables')}>
                            <div className="app-icon">
                                <i className="fas fa-dollar-sign"></i>
                            </div>
                            <h3>Variables</h3>
                            <p>Cálculo de comisiones e incentivos de marcas externas.</p>
                        </div>
                    )}

                    {/* Tarjeta: Saldos (Dinámica) */}
                    {modulosPermitidos.includes('Saldos') && (
                        <div className="app-card disabled-card" onClick={() => handleNavigate('Saldos')}>
                            <div className="app-icon">
                                <i className="fas fa-book-open"></i>
                            </div>
                            <h3>Saldos</h3>
                            <p>Consulta de liquidaciones y deudas.</p>
                        </div>
                    )}

                </section>

                <footer className="selection-footer">
                    <button className="btn-static" onClick={logout}>
                        <i className="fas fa-sign-out-alt"></i> Cerrar Sesión
                    </button>
                </footer>

            </div>
        </main>
    );
};