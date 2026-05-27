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
        <div className="modal-overlay" style={overlayStyle}>
            {toast.visible && (
                <div style={{...toastContainerStyle, borderLeft: toast.tipo === 'success' ? '6px solid #10b981' : '6px solid #ef4444'}}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <i className={toast.tipo === 'success' ? "fas fa-check-circle" : "fas fa-exclamation-circle"} style={{ fontSize: '1.4rem', color: toast.tipo === 'success' ? '#10b981' : '#ef4444' }}></i>
                        <div>
                            <strong style={{ display: 'block', fontSize: '14px', color: '#0f172a' }}>{toast.titulo}</strong>
                            <span style={{ fontSize: '13px', color: '#64748b' }}>{toast.mensaje}</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="modal-content modal-reporte-lg" style={{ ...modalBaseStyle, maxWidth: dimensiones.maxWidth, height: dimensiones.height }}>
                <div className="modal-header-box" style={{ padding: '16px 20px' }}>
                <h3>
                    {/* 🚀 Eliminamos por completo la flecha izquierda para limpiar la UI */}
                    <i className="fas fa-cogs" style={{ marginRight: '8px' }}></i> 
                    {vistaActiva === 'SELECTOR' && "Configuración General"}
                    {vistaActiva === 'CARGO' && "Cargo a Marca"}
                    {vistaActiva === 'MARCAS' && "Catálogo de Marcas"}
                    {vistaActiva === 'VARIABLES' && "Variables Contables"}
                </h3>
                <i 
                    className="fas fa-times close-modal" 
                    onClick={() => vistaActiva === 'SELECTOR' ? onClose() : setVistaActiva('SELECTOR')} 
                    style={{ cursor: 'pointer' }}
                ></i>
            </div>

                <div className="config-modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflow: 'hidden' }}>
                    {isLoading && <p style={{ textAlign: 'center', color: '#64748b', padding: '30px 0' }}><i className="fas fa-spinner fa-spin"></i> Cargando parámetros...</p>}
                    
                    {!isLoading && (
                        <>
                            {vistaActiva === 'SELECTOR' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                                    <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 10px 0', textAlign: 'center' }}>Selecciona el parámetro global corporativo que deseas administrar.</p>
                                    <button style={btnMenuOptStyle} onClick={() => setVistaActiva('CARGO')}>
                                        <div style={iconBoxStyle}><i className="fas fa-percentage"></i></div>
                                        <div style={{ textAlign: 'left' }}><strong style={{ display: 'block', color: '#1e293b' }}>Cargo a Marca %</strong><span style={{ fontSize: '11px', color: '#94a3b8' }}>Porcentaje financiero automatizado</span></div>
                                        <i className="fas fa-chevron-right" style={arrowRightStyle}></i>
                                    </button>
                                    <button style={btnMenuOptStyle} onClick={() => setVistaActiva('MARCAS')}>
                                        <div style={iconBoxStyle}><i className="fas fa-tags"></i></div>
                                        <div style={{ textAlign: 'left' }}><strong style={{ display: 'block', color: '#1e293b' }}>Actualizar Marcas</strong><span style={{ fontSize: '11px', color: '#94a3b8' }}>Agregar, editar o remover empresas</span></div>
                                        <i className="fas fa-chevron-right" style={arrowRightStyle}></i>
                                    </button>
                                    <button style={btnMenuOptStyle} onClick={() => setVistaActiva('VARIABLES')}>
                                        <div style={iconBoxStyle}><i className="fas fa-sliders-h"></i></div>
                                        <div style={{ textAlign: 'left' }}><strong style={{ display: 'block', color: '#1e293b' }}>Actualizar Variables</strong><span style={{ fontSize: '11px', color: '#94a3b8' }}>Códigos contables y descriptores</span></div>
                                        <i className="fas fa-chevron-right" style={arrowRightStyle}></i>
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

const overlayStyle = { display: 'flex', position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 3000, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', alignItems: 'center', justifyContent: 'center' };
const modalBaseStyle = { backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', transition: 'all 0.25s ease', overflow: 'hidden' };
const btnMenuOptStyle = { display: 'flex', alignItems: 'center', width: '100%', padding: '14px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', gap: '14px', transition: 'all 0.15s ease' };
const iconBoxStyle = { width: '38px', height: '38px', borderRadius: '6px', background: '#f1f5f9', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' };
const arrowRightStyle = { marginLeft: 'auto', color: '#94a3b8', fontSize: '0.85rem' };
const toastContainerStyle = { position: 'fixed', top: '25px', right: '25px', backgroundColor: '#ffffff', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '14px 20px', borderRadius: '8px', zIndex: 4000, minWidth: '300px', maxWidth: '400px' };