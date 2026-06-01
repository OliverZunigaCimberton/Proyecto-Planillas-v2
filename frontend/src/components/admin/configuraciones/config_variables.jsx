// src/components/admin/configuraciones/config_variables.jsx
import { useState } from 'react';
import { api } from '../../../services/api';

export const ConfigVariables = ({ variables, onRefresh }) => {
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
        } catch (error) { console.error(error); } finally { setIsLoading(false); }
    };

    const handleGuardarEditar = async () => {
        if (!varEditando?.codigo_variable?.trim() || !varEditando?.nombre_variable?.trim()) return;
        setIsLoading(true);
        try {
            const res = await api.admin.actualizarVariable(varEditando.id, varEditando.codigo_variable.trim().toUpperCase(), varEditando.nombre_variable.trim());
            if (res.success) {
                setVarEditando(null);
                if (onRefresh) onRefresh();
            }
        } catch (error) { console.error(error); } finally { setIsLoading(false); }
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
        } catch (error) { console.error(error); } finally { setIsLoading(false); }
    };

    return (
        <div className="admin-config-wrapper">
            
            {/* SEARCH & COUNTER */}
            <div className="admin-config-search-row">
                <div className="admin-config-search-box-var">
                    <i className="fas fa-search admin-config-search-icon"></i>
                    <input 
                        type="text" 
                        className="admin-config-search-input"
                        placeholder="Buscar por código contable o descripción..." 
                        value={filtro}
                        onChange={(e) => setFiltro(e.target.value)}
                    />
                </div>
                <span className="admin-config-counter-lbl">
                    Registros en pantalla: <strong className="admin-config-counter-total">{variablesFiltradas.length} conceptos</strong>
                </span>
            </div>

            {/* FORM CARD (FIJO - NO CRECE) */}
            <div className="admin-config-form-card">
                <div className="admin-config-grid-layout">
                    
                    <div className="admin-config-form-group">
                        <label className="admin-config-label">
                            CÓDIGO VARIABLE:
                        </label>
                        <input 
                            type="text" 
                            className="admin-config-input-code"
                            placeholder="" 
                            value={varEditando ? varEditando.codigo_variable : nuevoVarCodigo}
                            onChange={(e) => varEditando ? setVarEditando(p => ({ ...p, codigo_variable: e.target.value })) : setNuevoVarCodigo(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="admin-config-form-group">
                        <label className="admin-config-label">
                            DESCRIPCIÓN DEL CONCEPTO FINANCIERO:
                        </label>
                        <input 
                            type="text" 
                            className="admin-config-input-desc"
                            placeholder="" 
                            value={varEditando ? varEditando.nombre_variable : nuevoVarNombre}
                            onChange={(e) => varEditando ? setVarEditando(p => ({ ...p, nombre_variable: e.target.value })) : setNuevoVarNombre(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    {varEditando ? (
                        <div className="admin-config-btn-group">
                            <button className="btn-pri admin-config-btn-save" onClick={handleGuardarEditar} disabled={isLoading}>
                                <i className="fas fa-check"></i>
                            </button>
                            <button className="btn-sec admin-config-btn-cancel" onClick={() => setVarEditando(null)} disabled={isLoading}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                    ) : (
                        <button 
                            className="admin-config-btn-add"
                            onClick={handleAgregar} 
                            disabled={isLoading || !nuevoVarCodigo.trim() || !nuevoVarNombre.trim()}
                        >
                            <i className="fas fa-plus"></i>
                        </button>
                    )}
                </div>
            </div>

            {/* 📊 ÁREA DE TABLA LIQUIDA RECOLECTORA (FLEX: 1 ABSOLUTO) */}
            <div className="admin-config-table-container">
                <div className="admin-config-table-scroll">
                    <table className="admin-config-table">
                        <thead className="admin-config-thead">
                            <tr className="admin-config-th-row">
                                <th className="admin-config-th-code">CÓDIGO CONTABLE</th>
                                <th className="admin-config-th-desc">DESCRIPCIÓN DE LA VARIABLE CONTEBLE</th>
                                <th className="admin-config-th-actions">ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {variablesFiltradas.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="admin-config-empty-row">No se encontraron registros coincidentes.</td>
                                </tr>
                            ) : (
                                variablesFiltradas.map(v => (
                                    <tr key={v.id} className="admin-config-tbody-row">
                                        <td className="admin-config-td-code">{v.codigo_variable}</td>
                                        <td className="admin-config-td-desc">{v.nombre_variable}</td>
                                        <td className="admin-config-td-actions">
                                            <div className="admin-config-actions-flex">
                                                <i className="fas fa-edit admin-config-icon-edit" onClick={() => setVarEditando(v)} title="Editar"></i>
                                                <i className="fas fa-trash-alt admin-config-icon-trash" onClick={() => handleEliminar(v.id)} title="Eliminar"></i>
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