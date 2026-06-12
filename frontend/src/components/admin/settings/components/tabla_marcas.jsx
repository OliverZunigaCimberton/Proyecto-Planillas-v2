// frontend/src/components/admin/settings/components/tabla_marcas.jsx
import { useState } from 'react';
import { api } from '../../../../services/api';
import styles from '../styles/configuracion.module.css'; // Sincronizado en singular

/**
 * Subcomponente especializado para la visualización, filtrado y mantenimiento CRUD
 * del catálogo de marcas y sociedades corporativas del sistema.
 */
export const TablaMarcas = ({ marcas = [], onRefresh }) => {
    const [filtro, setFiltro] = useState('');
    const [nuevaMarca, setNuevaMarca] = useState('');
    const [marcaEditando, setMarcaEditando] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Estados para controlar el nuevo Modal de confirmación compacto
    const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
    const [marcaSeleccionada, setMarcaSeleccionada] = useState(null);

    // Filtro reactivo combinando el ID secuencial y las cadenas del nombre de marca
    const marcasFiltradas = marcas.filter(m => 
        m.nombre_marca?.toLowerCase().includes(filtro.toLowerCase()) || String(m.id).includes(filtro)
    );

    const handleAgregar = async () => {
        if (!nuevaMarca.trim()) return;
        setIsLoading(true);
        try {
            const res = await api.admin.crearMarca(nuevaMarca.trim().toUpperCase());
            if (res.success) {
                setNuevaMarca('');
                if (onRefresh) onRefresh();
            }
        } catch (error) { 
            console.error("Error al registrar nueva marca:", error); 
        } finally { 
            setIsLoading(false); 
        }
    };

    const handleGuardarEditar = async () => {
        if (!marcaEditando?.nombre_marca?.trim()) return;
        setIsLoading(true);
        try {
            const res = await api.admin.actualizarMarca(marcaEditando.id, marcaEditando.nombre_marca.trim().toUpperCase());
            if (res.success) {
                setMarcaEditando(null);
                if (onRefresh) onRefresh();
            }
        } catch (error) { 
            console.error("Error al actualizar marca existente:", error); 
        } finally { 
            setIsLoading(false); 
        }
    };

    // Abre el modal moderno guardando los datos de la marca elegida
    const handleSolicitarEliminar = (marca) => {
        setMarcaSeleccionada(marca);
        setModalEliminarAbierto(true);
    };

    // Detona la llamada real hacia el backend modular desde el botón del modal
    const handleConfirmarEliminacion = async () => {
        if (!marcaSeleccionada) return;
        setIsLoading(true);
        try {
            const res = await api.admin.eliminarMarca(marcaSeleccionada.id);
            if (res.success) {
                if (onRefresh) onRefresh();
            } else {
                alert(res.error || "No se pudo eliminar la marca porque se encuentra en uso activo dentro de las planillas.");
            }
        } catch (error) { 
            console.error("Error al remover marca corporativa:", error); 
        } finally { 
            setIsLoading(false); 
            setModalEliminarAbierto(false);
            setMarcaSeleccionada(null);
        }
    };

    return (
        <div className={styles.adminConfigWrapper}>
            
            {/* Sección: Barra de Filtrado y Contador de Registros */}
            <div className={styles.adminConfigSearchRow}>
                <div className={styles.adminConfigSearchBoxBrand}>
                    <i className={`fas fa-search ${styles.adminConfigSearchIcon}`}></i>
                    <input 
                        type="text" 
                        className={styles.adminConfigSearchInput}
                        placeholder="Buscar por código o nombre de marca..." 
                        value={filtro}
                        onChange={(e) => setFiltro(e.target.value)}
                        autoComplete="off"
                    />
                </div>
                <span className={styles.adminConfigCounterLbl}>
                    Registros en pantalla: <strong className={styles.adminConfigCounterTotal}>{marcasFiltradas.length} marcas</strong>
                </span>
            </div>

            {/* Sección: Formulario de Registro o Modificación Directa */}
            <div className={styles.adminConfigFormCard}>
                <div className={styles.adminConfigFlexLayout}>
                    
                    <div className={styles.adminConfigFormGroupFlex}>
                        <label htmlFor="brand-name-input" className={styles.adminConfigLabel}>
                            {marcaEditando ? "MODIFICAR NOMBRE DE LA MARCA:" : "NUEVA MARCA CORPORATIVA:"}
                        </label>
                        <input 
                            id="brand-name-input"
                            type="text" 
                            className={styles.adminConfigInputBrand}
                            placeholder="" 
                            value={marcaEditando ? marcaEditando.nombre_marca : nuevaMarca}
                            onChange={(e) => marcaEditando ? setMarcaEditando(p => ({ ...p, nombre_marca: e.target.value })) : setNuevaMarca(e.target.value)}
                            disabled={isLoading}
                            autoComplete="off"
                        />
                    </div>

                    {marcaEditando ? (
                        <div className={styles.adminConfigBtnGroup}>
                            <button 
                                type="button"
                                className={`btn-pri ${styles.adminConfigBtnSave}`} 
                                onClick={handleGuardarEditar} 
                                disabled={isLoading}
                            >
                                <i className="fas fa-check"></i>
                            </button>
                            <button 
                                type="button"
                                className={`btn-sec ${styles.adminConfigBtnCancel}`} 
                                onClick={() => setMarcaEditando(null)} 
                                disabled={isLoading}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                    ) : (
                        <button 
                            type="button"
                            className={styles.adminConfigBtnAdd} 
                            onClick={handleAgregar} 
                            disabled={isLoading || !nuevaMarca.trim()}
                        >
                            <i className="fas fa-plus"></i>
                        </button>
                    )}
                </div>
            </div>

            {/* Sección: Tabla de Contenidos Líquida con Scroll */}
            <div className={styles.adminConfigTableContainer}>
                <div className={styles.adminConfigTableScroll}>
                    <table className={styles.adminConfigTable}>
                        <thead className={styles.adminConfigThead}>
                            <tr className={styles.adminConfigThRow}>
                                <th className={styles.adminConfigThId}>CÓDIGO ID</th>
                                <th className={styles.adminConfigThDesc}>NOMBRE DE LA MARCA</th>
                                <th className={styles.adminConfigThActionsBrand}>ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {marcasFiltradas.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className={styles.adminConfigEmptyRow}>
                                        No se encontraron registros coincidentes.
                                    </td>
                                </tr>
                            ) : (
                                marcasFiltradas.map(m => (
                                    <tr key={m.id} className={styles.adminConfigTbodyRow}>
                                        <td className={styles.adminConfigTdId}>{m.id}</td>
                                        <td className={styles.adminConfigTdDesc}>{m.nombre_marca}</td>
                                        <td className={styles.adminConfigTdActions}>
                                            <div className={styles.adminConfigActionsFlex}>
                                                <i 
                                                    className={`fas fa-edit ${styles.adminConfigIconEdit}`} 
                                                    onClick={() => setMarcaEditando(m)} 
                                                    title="Editar denominación"
                                                ></i>
                                                <i 
                                                    className={`fas fa-trash-alt ${styles.adminConfigIconTrash}`} 
                                                    onClick={() => handleSolicitarEliminar(m)} 
                                                    title="Eliminar marca"
                                                ></i>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 🎯 MODAL COMPACTO DE CONFIRMACIÓN DE ELIMINACIÓN DE MARCA */}
            {modalEliminarAbierto && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    backgroundColor: 'rgba(15, 23, 42, 0.25)', backdropFilter: 'blur(3px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999
                }}>
                    <div style={{
                        backgroundColor: '#ffffff', 
                        borderRadius: '24px', 
                        padding: '28px 30px', 
                        width: '90%', 
                        maxWidth: '390px', 
                        textAlign: 'center',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        animation: 'fadeIn 0.15s ease-out'
                    }}>
                        {/* Encabezado con Icono Proporcionado */}
                        <div style={{ marginBottom: '16px' }}>
                            <i className="fas fa-trash-alt" style={{ fontSize: '2.2rem', color: 'var(--vino)', marginBottom: '12px', display: 'block' }}></i>
                            <h2 style={{ color: 'var(--vino)', fontSize: '1.45rem', fontWeight: '700', margin: 0, letterSpacing: '-0.3px' }}>
                                Eliminar Marca
                            </h2>
                        </div>

                        {/* Cuerpo del Mensaje */}
                        <div style={{ marginBottom: '24px' }}>
                            <p style={{ color: '#475569', fontSize: '13.5px', lineHeight: '1.5', margin: '0 0 8px 0' }}>
                                ¿Está seguro de eliminar la marca <strong>{marcaSeleccionada?.nombre_marca}</strong>?
                            </p>
                            <p style={{ color: '#94a3b8', fontSize: '12px', lineHeight: '1.4', margin: 0 }}>
                                Esta acción removerá el registro permanentemente del catálogo maestro.
                            </p>
                        </div>

                        {/* Botonera Inferior Proporcionada */}
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button 
                                type="button" 
                                className="btn-sec" 
                                style={{ padding: '10px 24px', borderRadius: '12px', fontWeight: '600', fontSize: '13px' }}
                                onClick={() => { setModalEliminarAbierto(false); setMarcaSeleccionada(null); }}
                            >
                                Cancelar
                            </button>
                            <button 
                                type="button" 
                                onClick={handleConfirmarEliminacion}
                                style={{ 
                                    backgroundColor: 'var(--vino)', 
                                    color: '#ffffff', 
                                    border: 'none', 
                                    padding: '10px 28px', 
                                    borderRadius: '12px', 
                                    fontWeight: '700', 
                                    fontSize: '13px', 
                                    cursor: 'pointer' 
                                }}
                            >
                                ELIMINAR
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};