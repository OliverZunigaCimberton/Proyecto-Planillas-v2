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

    // Estados para el Modal Compacto de Eliminación
    const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
    const [variableSeleccionada, setVariableSeleccionada] = useState(null);

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

    const handleSolicitarEliminar = (variable) => {
        setVariableSeleccionada(variable);
        setModalEliminarAbierto(true);
    };

    const handleConfirmarEliminacion = async () => {
        if (!variableSeleccionada) return;
        setIsLoading(true);
        try {
            const res = await api.admin.eliminarVariable(variableSeleccionada.id);
            if (res.success) {
                if (onRefresh) onRefresh();
            } else {
                alert(res.error || "No se pudo eliminar la variable porque está en uso activo.");
            }
        } catch (error) { 
            console.error("Error eliminando variable contable:", error); 
        } finally { 
            setIsLoading(false); 
            setModalEliminarAbierto(false);
            setVariableSeleccionada(null);
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
                                                    onClick={() => handleSolicitarEliminar(v)} 
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

            {/* 🎯 MODAL COMPACTO DE CONFIRMACIÓN DE ELIMINACIÓN DE VARIABLE */}
            {modalEliminarAbierto && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    backgroundColor: 'rgba(15, 23, 42, 0.25)', backdropFilter: 'blur(3px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999
                }}>
                    <div style={{
                        backgroundColor: '#ffffff', borderRadius: '24px', padding: '28px 30px',
                        width: '90%', maxWidth: '390px', textAlign: 'center',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        animation: 'fadeIn 0.15s ease-out'
                    }}>
                        <div style={{ marginBottom: '16px' }}>
                            <i className="fas fa-trash-alt" style={{ fontSize: '2.2rem', color: 'var(--vino)', marginBottom: '12px', display: 'block' }}></i>
                            <h2 style={{ color: 'var(--vino)', fontSize: '1.45rem', fontWeight: '700', margin: 0, letterSpacing: '-0.3px' }}>
                                Eliminar Variable
                            </h2>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <p style={{ color: '#475569', fontSize: '13.5px', lineHeight: '1.5', margin: '0 0 8px 0' }}>
                                ¿Está seguro de eliminar la variable <strong>{variableSeleccionada?.codigo_variable}</strong>?
                            </p>
                            <p style={{ color: '#94a3b8', fontSize: '12px', lineHeight: '1.4', margin: 0 }}>
                                Esta acción removerá el concepto permanentemente del catálogo financiero.
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button 
                                type="button" className="btn-sec" style={{ padding: '10px 24px', borderRadius: '12px', fontWeight: '600', fontSize: '13px' }}
                                onClick={() => { setModalEliminarAbierto(false); setVariableSeleccionada(null); }}
                            >
                                Cancelar
                            </button>
                            <button 
                                type="button" onClick={handleConfirmarEliminacion}
                                style={{ backgroundColor: 'var(--vino)', color: '#ffffff', border: 'none', padding: '10px 28px', borderRadius: '12px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
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