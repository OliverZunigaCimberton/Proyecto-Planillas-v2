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

    const handleEliminar = async (id) => {
        if (!confirm("¿Seguro que deseas eliminar esta marca de forma permanente?")) return;
        setIsLoading(true);
        try {
            const res = await api.admin.eliminarMarca(id);
            if (res.success) {
                if (onRefresh) onRefresh();
            } else {
                alert(res.error || "No se pudo eliminar la marca porque se encuentra en uso activo dentro de las planillas.");
            }
        } catch (error) { 
            console.error("Error al remover marca corporativa:", error); 
        } finally { 
            setIsLoading(false); 
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
                                                    onClick={() => handleEliminar(m.id)} 
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
        </div>
    );
};