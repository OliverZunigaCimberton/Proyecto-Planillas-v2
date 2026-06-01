// src/components/admin/confi.jsx
import { useState, useEffect } from 'react';
import { api } from '../../services/api';

// Importación segura de tus subcomponentes maestros
import { ConfigCargo } from './configuraciones/config_cargo';
import { ConfigMarca } from './configuraciones/config_marca';
import { ConfigVariables } from './configuraciones/config_variables';

export const Confi = ({ onClose }) => {
    const [vistaActiva, setVistaActiva] = useState('SELECTOR');
    const [isLoading, setIsLoading] = useState(true);
    const [catalogos, setCatalogos] = useState({ marcas: [], variables: [], porcentaje: 0.1725 });
    const [toast, setToast] = useState({ visible: false, titulo: '', mensaje: '', tipo: 'success' });

    const lanzarToast = (titulo, mensaje, tipo = 'success') => {
        setToast({ visible: true, titulo, mensaje, tipo });
        setTimeout(() => {
            setToast(prev => ({ ...prev, visible: false }));
        }, 3500);
    };

    useEffect(() => {
        let isMounted = true;
        api.admin.getInicial()
            .then((res) => {
                if (isMounted && res.success) {
                    setCatalogos({
                        marcas: res.marcas || [],
                        variables: res.variables || [],
                        porcentaje: res.porcentajeCargoMarca
                    });
                }
            })
            .catch((error) => {
                console.error("Error crítico en catálogos:", error);
            })
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });

        return () => { isMounted = false; };
    }, []);

    const handleRefrescoExitoso = async (tipoConfig) => {
        setIsLoading(true);
        try {
            const res = await api.admin.getInicial();
            if (res.success) {
                setCatalogos({
                    marcas: res.marcas || [],
                    variables: res.variables || [],
                    porcentaje: res.porcentajeCargoMarca
                });
                lanzarToast("¡Sincronizado!", `El catálogo de ${tipoConfig} se actualizó con éxito.`, "success");
            }
        } catch (error) {
            console.error(error);
            lanzarToast("Error", "No se pudieron refrescar los datos.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    // 👑 REGLA DE DIMENSIÓN: Ampliado a 85vh para máxima visualización
    const dimensiones = (() => {
        switch (vistaActiva) {
            case 'CARGO': return { maxWidth: '380px', height: 'auto' };
            case 'SELECTOR': return { maxWidth: '460px', height: 'auto' };
            default: return { maxWidth: '780px', height: '85vh' }; 
        }
    })();

    return (
        <div className="admin-confi-overlay">
            {toast.visible && (
                <div className="admin-confi-toast" style={{ borderLeft: toast.tipo === 'success' ? '6px solid #10b981' : '6px solid #ef4444' }}>
                    <div className="admin-confi-toast-flex">
                        <i className={toast.tipo === 'success' ? "fas fa-check-circle" : "fas fa-exclamation-circle"} style={{ fontSize: '1.4rem', color: toast.tipo === 'success' ? '#10b981' : '#ef4444' }}></i>
                        <div>
                            <strong className="admin-confi-toast-title">{toast.titulo}</strong>
                            <span className="admin-confi-toast-msg">{toast.mensaje}</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="modal-content modal-reporte-lg admin-confi-modal-base" style={{ maxWidth: dimensiones.maxWidth, height: dimensiones.height }}>
                <div className="modal-header-box admin-confi-header-box">
                <h3>
                    {/* 🚀 Eliminamos por completo la flecha izquierda para limpiar la UI */}
                    <i className="fas fa-cogs admin-period-icon-spacing"></i> 
                    {vistaActiva === 'SELECTOR' && "Configuración General"}
                    {vistaActiva === 'CARGO' && "Cargo a Marca"}
                    {vistaActiva === 'MARCAS' && "Catálogo de Marcas"}
                    {vistaActiva === 'VARIABLES' && "Variables Contables"}
                </h3>
                <i 
                    className="fas fa-times close-modal" 
                    onClick={() => vistaActiva === 'SELECTOR' ? onClose() : setVistaActiva('SELECTOR')} 
                ></i>
            </div>

                <div className="config-modal-body admin-confi-body">
                    {isLoading && <p className="admin-confi-loader"><i className="fas fa-spinner fa-spin"></i> Cargando parámetros...</p>}
                    
                    {!isLoading && (
                        <>
                            {vistaActiva === 'SELECTOR' && (
                                <div className="admin-confi-menu-layout">
                                    <p className="admin-confi-menu-desc">Selecciona el parámetro global corporativo que deseas administrar.</p>
                                    <button className="admin-confi-menu-opt" onClick={() => setVistaActiva('CARGO')}>
                                        <div className="admin-confi-menu-icon-box"><i className="fas fa-percentage"></i></div>
                                        <div className="admin-confi-menu-lbl-box"><strong className="admin-confi-menu-lbl-main">Cargo a Marca %</strong><span className="admin-confi-menu-lbl-sub">Porcentaje financiero automatizado</span></div>
                                        <i className="fas fa-chevron-right admin-confi-menu-arrow"></i>
                                    </button>
                                    <button className="admin-confi-menu-opt" onClick={() => setVistaActiva('MARCAS')}>
                                        <div className="admin-confi-menu-icon-box"><i className="fas fa-tags"></i></div>
                                        <div className="admin-confi-menu-lbl-box"><strong className="admin-confi-menu-lbl-main">Actualizar Marcas</strong><span className="admin-confi-menu-lbl-sub">Agregar, editar o remover empresas</span></div>
                                        <i className="fas fa-chevron-right admin-confi-menu-arrow"></i>
                                    </button>
                                    <button className="admin-confi-menu-opt" onClick={() => setVistaActiva('VARIABLES')}>
                                        <div className="admin-confi-menu-icon-box"><i className="fas fa-sliders-h"></i></div>
                                        <div className="admin-confi-menu-lbl-box"><strong className="admin-confi-menu-lbl-main">Actualizar Variables</strong><span className="admin-confi-menu-lbl-sub">Códigos contables y descriptores</span></div>
                                        <i className="fas fa-chevron-right admin-confi-menu-arrow"></i>
                                    </button>
                                </div>
                            )}
                            {vistaActiva === 'CARGO' && <ConfigCargo porcentajeInicial={catalogos.porcentaje} onRefresh={() => handleRefrescoExitoso('Porcentaje')} onBack={() => setVistaActiva('SELECTOR')} notificar={lanzarToast} />}
                            {vistaActiva === 'MARCAS' && <ConfigMarca marcas={catalogos.marcas} onRefresh={() => handleRefrescoExitoso('Marcas')} />}
                            {vistaActiva === 'VARIABLES' && <ConfigVariables variables={catalogos.variables} onRefresh={() => handleRefrescoExitoso('Variables')} />}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};