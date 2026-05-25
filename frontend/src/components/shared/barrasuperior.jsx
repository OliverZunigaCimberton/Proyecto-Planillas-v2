// src/components/shared/barrasuperior.jsx
import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { useAuth } from '../../hooks/useauth';
import { api } from '../../services/api';

const formatearFecha = (fechaStr) => {
    if (!fechaStr) return "--/--/--";
    const [y, m, d] = fechaStr.split('T')[0].split('-');
    return `${d.substring(0, 2)}/${m}/${y.slice(-2)}`;
};

// Función robusta para garantizar que JavaScript nunca genere un "Invalid Date" (Evita el NaN)
const safeDateParse = (dateStr, timeStr = "00:00:00") => {
    try {
        if (!dateStr) return null;
        
        // Limpiamos la fecha (extraemos solo YYYY-MM-DD por si viene como ISO completo)
        const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
        
        // Limpiamos y estructuramos la hora (asegurando el formato HH:mm:ss)
        let timePart = "00:00:00";
        if (timeStr) {
            const rawTime = timeStr.includes('T') ? timeStr.split('T')[1] : timeStr;
            const cleanTime = rawTime.split('-')[0].split('+')[0].trim(); // Quitar zonas horarias
            const tParts = cleanTime.split(':');
            timePart = `${(tParts[0] || '00').padStart(2, '0')}:${(tParts[1] || '00').padStart(2, '0')}:${(tParts[2] || '00').padStart(2, '0')}`;
        }
        
        const dateObj = new Date(`${datePart}T${timePart}`);
        return isNaN(dateObj.getTime()) ? null : dateObj.getTime();
    } catch (error) {
        // ✨ CORRECCIÓN DE ESLINT: Ahora usamos la variable 'error' para evitar el "no-unused-vars"
        console.warn("Aviso en el formateo de fecha segura:", error);
        return null;
    }
};

// Asignamos 'MIS_REPORTES' por defecto por si un componente no envía la prop
export const BarraSuperior = ({ periodoSeleccionado, setPeriodoSeleccionado, onMenuClick, vistaActual = 'MIS_REPORTES' }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate(); 
    const [periodos, setPeriodos] = useState([]);
    
    // Guardamos TODAS las excepciones del usuario aquí
    const [listaExcepciones, setListaExcepciones] = useState([]);
    
    // Controladores de menús
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isPeriodDropOpen, setIsPeriodDropOpen] = useState(false);
    
    const menuRef = useRef(null);
    const periodDropRef = useRef(null); 
    const menuTimeoutRef = useRef(null); 
    
    const [corteTexto, setCorteTexto] = useState({ 
        texto: "ESPERANDO PERIODO...", 
        clase: "corte-waiting" 
    });

    // Cerrar menús al hacer clic afuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
            if (periodDropRef.current && !periodDropRef.current.contains(event.target)) {
                setIsPeriodDropOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Cargar catálogo de periodos
    useEffect(() => {
        const fetchPeriodos = async () => {
            try {
                const result = await api.admin.getPeriodos();
                const data = result.data || [];
                setPeriodos(data);
                
                if (!periodoSeleccionado) {
                    // Modificación: Busca ABIERTO o ACTIVO
                    const activo = data.find(p => {
                        const est = p.estado?.toString().trim().toUpperCase();
                        return est === 'ABIERTO' || est === 'ACTIVO';
                    });
                    
                    if (activo) {
                        setPeriodoSeleccionado(activo.id.toString());
                    } else if (data.length > 0) {
                        setPeriodoSeleccionado(data[0].id.toString());
                    }
                }
            } catch (error) {
                console.error("Error al cargar periodos en cabecera:", error);
            }
        };
        fetchPeriodos();
    }, [periodoSeleccionado, setPeriodoSeleccionado]);

    // 1. CARGAMOS TODAS LAS EXCEPCIONES DEL USUARIO UNA SOLA VEZ
    useEffect(() => {
        const fetchExcepciones = async () => {
            if (!periodoSeleccionado || !user?.codigo) {
                setListaExcepciones([]);
                return;
            }
            try {
                const res = await api.shared.getExcepcionActiva(periodoSeleccionado, user.codigo);
                setListaExcepciones(res?.data || []);
            } catch (error) {
                console.error("Error al consultar excepciones:", error);
                setListaExcepciones([]);
            }
        };
        fetchExcepciones();
    }, [periodoSeleccionado, user?.codigo]);

    // 2. ✨ CEREBRO DEL RELOJ: Filtra la excepción dinámicamente según la pestaña (vistaActual)
    const excepcionActiva = useMemo(() => {
        if (!listaExcepciones || listaExcepciones.length === 0) return null;

        if (vistaActual === 'AUTORIZACIONES') {
            // El Autorizador está en su bandeja revisando a otros: Tiempo para AUTORIZAR
            return listaExcepciones.find(exc => 
                String(exc.codigo_autorizador) === String(user?.codigo) && 
                exc.tipo_permiso === 'AUTORIZAR'
            );
        } else {
            // El Reportante (o el Autorizador en su bandeja personal): Tiempo para CREAR
            return listaExcepciones.find(exc => 
                String(exc.codigo_empleado) === String(user?.codigo) && 
                (exc.tipo_permiso || 'CREAR') === 'CREAR'
            );
        }
    }, [listaExcepciones, vistaActual, user?.codigo]);

    // 3. RELOJ REACTIVO Y SEGURO CONTRA "NaN"
    useEffect(() => {
        if (!periodoSeleccionado || periodos.length === 0) return;

        const per = periodos.find(p => p.id.toString() === periodoSeleccionado);
        if (!per) return;

        let intervaloReloj;

        const actualizarCronometro = () => {
            // ✨ REGLA ABSOLUTA: Si está CERRADO o INACTIVO, se apaga todo (ignora excepciones)
            const estadoActual = per.estado?.toString().trim().toUpperCase();
            if (estadoActual === 'INACTIVO' || estadoActual === 'CERRADO') {
                setCorteTexto({ texto: "PERIODO CERRADO", clase: "no-period-alert" });
                return true; 
            }
            
            const inicio = safeDateParse(per.fecha_desde, "00:00:00");
            const finGlobal = safeDateParse(per.fecha_corte, per.hora_corte);
            
            let finAUsar = finGlobal;
            let esTiempoGracia = false;

            // ✨ LÓGICA DE HERENCIA Y GRACIA
            if (excepcionActiva && excepcionActiva.nueva_fecha_corte && excepcionActiva.nueva_hora_corte) {
                const finGracia = safeDateParse(excepcionActiva.nueva_fecha_corte, excepcionActiva.nueva_hora_corte);
                // Si existe el tiempo de gracia válido, prevalece sobre el reloj global de la barra
                if (finGracia) {
                    finAUsar = finGracia;
                    esTiempoGracia = true;
                }
            }

            // Candado de seguridad por si las fechas llegaron incompletas de la base de datos
            if (!inicio || !finAUsar) {
                setCorteTexto({ texto: "FECHAS INVÁLIDAS", clase: "no-period-alert" });
                return true;
            }
                
            const ahora = new Date().getTime();
            
            if (ahora < inicio) {
                const fechaD = new Date(inicio);
                const diaStr = String(fechaD.getDate()).padStart(2, '0');
                const mesStr = String(fechaD.getMonth() + 1).padStart(2, '0');
                const anioStr = String(fechaD.getFullYear()).slice(-2);
                setCorteTexto({ texto: `Inicia el ${diaStr}/${mesStr}/${anioStr}`, clase: "corte-waiting" });
                return false;
            }
            
            const distancia = finAUsar - ahora;
            if (distancia < 0) {
                setCorteTexto({ texto: "TIEMPO AGOTADO", clase: "no-period-alert" });
                return true; 
            }
            
            const dias = Math.floor(distancia / (1000 * 60 * 60 * 24));
            const horas = Math.floor((distancia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutos = Math.floor((distancia % (1000 * 60 * 60)) / (1000 * 60));
            const segundos = Math.floor((distancia % (1000 * 60)) / 1000);

            setCorteTexto({ 
                texto: esTiempoGracia 
                    ? `Gracia: ${dias}d ${horas}h ${minutos}m ${segundos}s` 
                    : `${dias}d ${horas}h ${minutos}m ${segundos}s`, 
                clase: "corte-active" 
            });
            return false;
        };

        const timeoutId = setTimeout(() => {
            const terminado = actualizarCronometro();
            const estadoActual = per.estado?.toString().trim().toUpperCase();
            
            // No iniciar el intervalo si el periodo ya está cerrado o tiene fallo de fechas
            if (!terminado && estadoActual !== 'INACTIVO' && estadoActual !== 'CERRADO') {
                intervaloReloj = setInterval(actualizarCronometro, 1000);
            }
        }, 0);

        return () => {
            clearTimeout(timeoutId);
            if (intervaloReloj) clearInterval(intervaloReloj);
        };
    }, [periodoSeleccionado, periodos, excepcionActiva]);

    const userRol = user?.rol?.toUpperCase() || 'REPORTANTE';
    const modulosPermitidos = user?.modulos || []; 

    const periodoActualEncontrado = periodos.find(p => p.id.toString() === periodoSeleccionado);
    
    // Modificación: Etiqueta principal (ABIERTO) / (CERRADO)
    const isCurrentOpen = ['ABIERTO', 'ACTIVO'].includes(periodoActualEncontrado?.estado?.toString().trim().toUpperCase());
    const labelPeriodoActivo = periodoActualEncontrado 
        ? `${formatearFecha(periodoActualEncontrado.fecha_desde)} - ${formatearFecha(periodoActualEncontrado.fecha_hasta)} ${isCurrentOpen ? '(ABIERTO)' : '(CERRADO)'}`
        : "SELECCIONE PERIODO";

    return (
        <header className="main-header">
            <div className="header-left">
                <h1 className="logo-text">Reporte de Variables</h1>
            </div>

            <div className="header-center">
                <div className="info-pill">
                    <label>PERIODO:</label>
                    <div className="sgp-dropdown-wrapper" ref={periodDropRef}>
                        <div 
                            className="sgp-dropdown-trigger" 
                            onClick={() => setIsPeriodDropOpen(!isPeriodDropOpen)}
                        >
                            <span>{labelPeriodoActivo}</span>
                            <i className={`fas fa-chevron-down sgp-arrow-icon ${isPeriodDropOpen ? 'sgp-rotate' : ''}`}></i>
                        </div>

                        {isPeriodDropOpen && (
                            <div className="sgp-dropdown-menu" style={{ maxHeight: '160px', overflowY: 'auto' }}>
                                {periodos.length === 0 ? (
                                    <div className="sgp-dropdown-item sgp-disabled">SIN REGISTROS</div>
                                ) : (
                                    periodos.map(p => {
                                        // Modificación: Determinación de estado para el menú desplegable
                                        const isOpen = ['ABIERTO', 'ACTIVO'].includes(p.estado?.toString().trim().toUpperCase());
                                        return (
                                            <div 
                                                key={p.id} 
                                                className={`sgp-dropdown-item ${p.id.toString() === periodoSeleccionado ? 'sgp-selected' : ''}`}
                                                onClick={() => {
                                                    setPeriodoSeleccionado(p.id.toString());
                                                    setIsPeriodDropOpen(false);
                                                }}
                                            >
                                                <i className={`fas ${isOpen ? 'fa-lock-open sgp-text-success' : 'fa-lock sgp-text-danger'}`}></i>
                                                <span className="sgp-date-text">
                                                    {formatearFecha(p.fecha_desde)} - {formatearFecha(p.fecha_hasta)}
                                                    <strong style={{ marginLeft: '6px', color: isOpen ? '#2ecc71' : '#e74c3c' }}>
                                                        {isOpen ? '(ABIERTO)' : '(CERRADO)'}
                                                    </strong>
                                                </span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="info-pill">
                    <span>Corte: <strong className={corteTexto.clase}>{corteTexto.texto}</strong></span>
                </div>
            </div>

            <div className="header-right">
                <div 
                    className="profile-trigger" 
                    ref={menuRef} 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    onMouseEnter={() => {
                        if (menuTimeoutRef.current) clearTimeout(menuTimeoutRef.current);
                        setIsMenuOpen(true);
                    }}
                    onMouseLeave={() => {
                        menuTimeoutRef.current = setTimeout(() => {
                            setIsMenuOpen(false);
                        }, 150);
                    }}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
                >
                    {/* ZONA INTACTA: No se ha modificado la información ni estructura del usuario */}
                    <div className="user-data" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', lineHeight: '1.15' }}>
                        <span className="u-name" style={{ fontSize: '0.85rem', fontWeight: '700', color: '#ffffff' }}>
                            {user?.nombre?.toUpperCase() || 'USUARIO'} {user?.codigo ? `(${user.codigo})` : ''}
                        </span>
                        <span className="u-email" style={{ fontSize: '0.72rem', color: '#8a9ba8', textTransform: 'lowercase' }}>{user?.correo}</span>
                        <span className="u-role" style={{ fontSize: '0.70rem', color: '#a0aec0', fontWeight: '600' }}>{userRol}</span>
                    </div>

                    <div className="gear-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fas fa-cog gear-icon" style={{ fontSize: '1rem', margin: 0 }}></i>
                    </div>
                    
                    <div 
                        className={`glass-dropdown ${isMenuOpen ? 'd-flex' : 'd-none'}`}
                        style={{ display: isMenuOpen ? 'flex' : 'none' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="dropdown-section">MÓDULOS</div>

                        <button className="dropdown-btn" onClick={() => { setIsMenuOpen(false); navigate('/seleccionapp'); }}>
                            <i className="fas fa-th-large"></i> Panel Principal
                        </button>

                        {modulosPermitidos.includes('Horas Extras') && (
                            <button 
                                className="dropdown-btn" 
                                disabled 
                                style={{ color: '#8a9ba8', cursor: 'not-allowed', opacity: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
                            >
                                <span><i className="fas fa-clock" style={{ marginRight: '10px' }}></i> Módulo Horas Extras</span>
                                <i className="fas fa-lock" style={{ fontSize: '0.8rem', color: '#ff4d4d' }}></i>
                            </button>
                        )}

                        {modulosPermitidos.includes('Variables') && (
                            <button className="dropdown-btn" onClick={() => {
                                setIsMenuOpen(false);
                                if (userRol === 'ADMIN') navigate('/adminvariables');
                                else if (userRol === 'REPORTANTE') navigate('/reportantevariables');
                                else if (userRol === 'AUTORIZADOR') navigate('/autorizadorvariables');
                                else if (userRol === 'CONTADOR') navigate('/contadorvariables');
                            }}>
                                <i className="fas fa-file-invoice-dollar"></i> Módulo Variables
                            </button>
                        )}

                        {modulosPermitidos.includes('Saldos') && (
                            <button 
                                className="dropdown-btn" 
                                disabled 
                                style={{ color: '#8a9ba8', cursor: 'not-allowed', opacity: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
                            >
                                <span><i className="fas fa-book" style={{ marginRight: '10px' }}></i> Módulo Saldos</span>
                                <i className="fas fa-lock" style={{ fontSize: '0.8rem', color: '#ff4d4d' }}></i>
                            </button>
                        )}
                        
                        {userRol === 'ADMIN' && (
                            <>
                                <div className="dropdown-divider"></div>
                                <div className="dropdown-section">GESTIÓN</div>
                                <button className="dropdown-btn" onClick={(e) => { e.stopPropagation(); onMenuClick('PERIODOS'); setIsMenuOpen(false); }}><i className="fas fa-calendar-check"></i> Gestión de Periodos</button>
                                
                                <button className="dropdown-btn" onClick={(e) => { e.stopPropagation(); onMenuClick('USUARIOS'); setIsMenuOpen(false); }}><i className="fas fa-users-cog"></i> Gestión de Usuarios</button>

                                <button className="dropdown-btn" onClick={(e) => { e.stopPropagation(); onMenuClick('EXCEPCIONES'); setIsMenuOpen(false); }}><i className="fas fa-hourglass-half"></i> Tiempo de Gracia</button>
                            </>
                        )}
                        
                        <div className="dropdown-divider"></div>
                        <button className="dropdown-btn logout-item" onClick={logout}><i className="fas fa-sign-out-alt"></i> Cerrar Sesión</button>
                    </div>
                </div>
            </div>
        </header>
    );
};