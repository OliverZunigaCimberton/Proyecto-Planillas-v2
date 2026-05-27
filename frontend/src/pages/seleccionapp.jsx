// src/pages/seleccionapp.jsx
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useauth';

export const SeleccionApp = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Matriz de permisos que viene desde la base de datos (Supabase)
    const modulosPermitidos = user?.modulos || [];

    const handleNavigate = (modulo) => {
        // 1. Diccionario de mapeo: Traduce el nombre del botón al parámetro de la URL (:fase)
        const mapaFases = {
            'Variables': 'variables',
            'Horas Extras': 'horas-extras',
            'Saldos': 'saldos'
        };

        const fase = mapaFases[modulo];
        if (!fase) return; // Salvaguarda por si acaso

        let rol = user?.rol?.toUpperCase() || '';
        
        // HOMOLOGACIÓN: Traduce los roles crudos de Supabase al estándar de rutas del Frontend
        if (rol === 'ADMINISTRACIÓN' || rol === 'ADMINISTRACION') rol = 'ADMIN';
        if (rol === 'REPORTERO') rol = 'REPORTANTE';

        // 2. Enrutador Maestro: Envía a cualquier rol a cualquier fase autorizada
        switch (rol) {
            case 'ADMIN':
                navigate(`/admin/${fase}`);
                break;
            case 'REPORTANTE':
                navigate(`/reportante/${fase}`);
                break;
            case 'AUTORIZADOR':
                navigate(`/autorizador/${fase}`);
                break;
            case 'CONTADOR':
                navigate(`/contador/${fase}`);
                break;
            default:
                alert(`Rol no configurado en el sistema: ${rol}`);
                break;
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
                    
                    {/* Tarjeta: Horas Extras (Gobernada por Base de Datos) */}
                    {modulosPermitidos.includes('Horas Extras') && (
                        <div className="app-card active-card" onClick={() => handleNavigate('Horas Extras')}>
                            <div className="app-icon">
                                <i className="far fa-clock"></i>
                            </div>
                            <h3>Horas Extras</h3>
                            <p>Registro y control de tiempo adicional.</p>
                        </div>
                    )}

                    {/* Tarjeta: Variables (Gobernada por Base de Datos) */}
                    {modulosPermitidos.includes('Variables') && (
                        <div className="app-card active-card" onClick={() => handleNavigate('Variables')}>
                            <div className="app-icon">
                                <i className="fas fa-dollar-sign"></i>
                            </div>
                            <h3>Variables</h3>
                            <p>Cálculo de comisiones e incentivos de marcas externas.</p>
                        </div>
                    )}

                    {/* Tarjeta: Saldos (Gobernada por Base de Datos) */}
                    {modulosPermitidos.includes('Saldos') && (
                        <div className="app-card active-card" onClick={() => handleNavigate('Saldos')}>
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