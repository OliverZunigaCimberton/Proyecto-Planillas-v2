import { useState } from 'react';
import { api } from '../../../../services/api';
import styles from '../styles/configuracion.module.css'; // Sincronizado en singular

/**
 * Subcomponente especializado para la visualización, filtrado y mantenimiento CRUD
 * del catálogo de variables contables y descriptores financieros de la plataforma.
 */
export const TablaVariables = ({ variables = [], onRefresh }) => {
    const [filtro, setFiltro] = useState('');
    const [nuevoVarCodigo, setNuevoVarCodigo] = useState('');
    const [nuevoVarNombre, setNuevoVarNombre] = useState('');
    const [varEditando, setVarEditando] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Filtro reactivo combinando código contable y nombre descriptivo
    const variablesFiltradas = variables.filter(v => 
        v.codigo_variable?.toLowerCase().includes(filtro.toLowerCase()) ||
        v.nombre_variable?.toLowerCase().includes(filtro.toLowerCase())
    );

    const handleAgregar = async () => {
        if (!nuevoVarCodigo.trim() || !nuevoVarNombre.trim()) return;
        setIsLoading(true);
        try {
            const res = await api.admin.crearVariable(nuevoVarCodigo.trim().toUpperCase(), nuevoVarNombre.trim());
            if (res.success) {
                setNuevoVarCodigo('');
                setNuevoVarNombre('');
                if (onRefresh) onRefresh();
            }
        } catch (error) { 
            console.error("Error agregando nueva variable contable:", error); 
        } finally { 
            setIsLoading(false); 
        }
    };

    const handleGuardarEditar = async () => {
        if (!varEditando?.codigo_variable?.trim() || !varEditando?.nombre_variable?.trim()) return;
        setIsLoading(true);
        try {
            const res = await api.admin.actualizarVariable(
                varEditando.id, 
                varEditando.codigo_variable.trim().toUpperCase(), 
                varEditando.nombre_variable.trim()
            );
            if (res.success) {
                setVarEditando(null);
                if (onRefresh) onRefresh();
            }
        } catch (error) { 
            console.error("Error editando variable contable:", error); 
        } finally { 
            setIsLoading(false); 
        }
    };

    const handleEliminar = async (id) => {
        if (!confirm("¿Seguro que deseas eliminar esta variable contable de forma permanente?")) return;
        setIsLoading(true);
        try {
            const res = await api.admin.eliminarVariable(id);
            if (res.success) {
                if (onRefresh) onRefresh();
            } else {
                alert(res.error || "No se pudo eliminar la variable porque está en uso.");
            }
        } catch (error) { 
            console.error("Error eliminando variable contable:", error); 
        } finally { 
            setIsLoading(false); 
        }
    };

    return (
        <div className={styles.adminConfigWrapper}>
            
            {/* Sección: Barra de Filtrado y Contador */}
            <div className={styles.adminConfigSearchRow}>
                <div className={styles.adminConfigSearchBoxVar}>
                    <i className={`fas fa-search ${styles.adminConfigSearchIcon}`}></i>
                    <input 
                        type="text" 
                        className={styles.adminConfigSearchInput}
                        placeholder="Buscar por código contable o descripción..." 
                        value={filtro}
                        onChange={(e) => setFiltro(e.target.value)}
                        autoComplete="off"
                    />
                </div>
                <span className={styles.adminConfigCounterLbl}>
                    Registros en pantalla: <strong className={styles.adminConfigCounterTotal}>{variablesFiltradas.length} conceptos</strong>
                </span>
            </div>

            {/* Sección: Formulario Fijo (Alta / Edición) */}
            <div className={styles.adminConfigFormCard}>
                <div className={styles.adminConfigGridLayout}>
                    
                    <div className={styles.adminConfigFormGroup}>
                        <label htmlFor="var-code-input" className={styles.adminConfigLabel}>
                            CÓDIGO VARIABLE:
                        </label>
                        <input 
                            id="var-code-input"
                            type="text" 
                            className={styles.adminConfigInputCode}
                            placeholder="" 
                            value={varEditando ? varEditando.codigo_variable : nuevoVarCodigo}
                            onChange={(e) => varEditando 
                                ? setVarEditando(p => ({ ...p, codigo_variable: e.target.value })) 
                                : setNuevoVarCodigo(e.target.value)
                            }
                            disabled={isLoading}
                            autoComplete="off"
                        />
                    </div>

                    <div className={styles.adminConfigFormGroup}>
                        <label htmlFor="var-desc-input" className={styles.adminConfigLabel}>
                            DESCRIPCIÓN DEL CONCEPTO FINANCIERO:
                        </label>
                        <input 
                            id="var-desc-input"
                            type="text" 
                            className={styles.adminConfigInputDesc}
                            placeholder="" 
                            value={varEditando ? varEditando.nombre_variable : nuevoVarNombre}
                            onChange={(e) => varEditando 
                                ? setVarEditando(p => ({ ...p, nombre_variable: e.target.value })) 
                                : setNuevoVarNombre(e.target.value)
                            }
                            disabled={isLoading}
                            autoComplete="off"
                        />
                    </div>

                    {varEditando ? (
                        <div className={styles.adminConfigBtnGroup}>
                            <button 
                                type="button"
                                className={`btn-pri ${styles.adminConfigBtnSave}`} 
                                onClick={handleGuardarEditar} 
                                disabled={isLoading}
                                title="Guardar cambios"
                            >
                                <i className="fas fa-check"></i>
                            </button>
                            <button 
                                type="button"
                                className={`btn-sec ${styles.adminConfigBtnCancel}`} 
                                onClick={() => setVarEditando(null)} 
                                disabled={isLoading}
                                title="Cancelar edición"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                    ) : (
                        <button 
                            type="button"
                            className={styles.adminConfigBtnAdd}
                            onClick={handleAgregar} 
                            disabled={isLoading || !nuevoVarCodigo.trim() || !nuevoVarNombre.trim()}
                            title="Agregar concepto"
                        >
                            <i className="fas fa-plus"></i>
                        </button>
                    )}
                </div>
            </div>

            {/* Sección: Tabla de Registros Colectora Líquida */}
            <div className={styles.adminConfigTableContainer}>
                <div className={styles.adminConfigTableScroll}>
                    <table className={styles.adminConfigTable}>
                        <thead className={styles.adminConfigThead}>
                            <tr className={styles.adminConfigThRow}>
                                <th className={styles.adminConfigThCode}>CÓDIGO CONTABLE</th>
                                <th className={styles.adminConfigThDesc}>DESCRIPCIÓN DE LA VARIABLE CONTABLE</th>
                                <th className={styles.adminConfigThActions}>ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {variablesFiltradas.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className={styles.adminConfigEmptyRow}>
                                        No se encontraron registros coincidentes.
                                    </td>
                                </tr>
                            ) : (
                                variablesFiltradas.map(v => (
                                    <tr key={v.id} className={styles.adminConfigTbodyRow}>
                                        <td className={styles.adminConfigTdCode}>{v.codigo_variable}</td>
                                        <td className={styles.adminConfigTdDesc}>{v.nombre_variable}</td>
                                        <td className={styles.adminConfigTdActions}>
                                            <div className={styles.adminConfigActionsFlex}>
                                                <i 
                                                    className={`fas fa-edit ${styles.adminConfigIconEdit}`} 
                                                    onClick={() => setVarEditando(v)} 
                                                    title="Editar variable"
                                                ></i>
                                                <i 
                                                    className={`fas fa-trash-alt ${styles.adminConfigIconTrash}`} 
                                                    onClick={() => handleEliminar(v.id)} 
                                                    title="Eliminar variable"
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