// src/components/admin/configuraciones/config_marca.jsx
import { useState } from 'react';
import { api } from '../../../services/api';

export const ConfigMarca = ({ marcas, onRefresh }) => {
    const [filtro, setFiltro] = useState('');
    const [nuevaMarca, setNuevaMarca] = useState('');
    const [marcaEditando, setMarcaEditando] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

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
        } catch (error) { console.error(error); } finally { setIsLoading(false); }
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
        } catch (error) { console.error(error); } finally { setIsLoading(false); }
    };

    const handleEliminar = async (id) => {
        if (!confirm("¿Seguro que deseas eliminar esta marca de forma permanente?")) return;
        setIsLoading(true);
        try {
            const res = await api.admin.eliminarMarca(id);
            if (res.success) {
                if (onRefresh) onRefresh();
            } else {
                alert(res.error || "No se pudo eliminar la marca porque está en uso.");
            }
        } catch (error) { console.error(error); } finally { setIsLoading(false); }
    };

    return (
        <div className="admin-config-wrapper">
            
            {/* SEARCH BAR & COUNTER */}
            <div className="admin-config-search-row">
                <div className="admin-config-search-box-brand">
                    <i className="fas fa-search admin-config-search-icon"></i>
                    <input 
                        type="text" 
                        className="admin-config-search-input"
                        placeholder="Buscar por código o nombre de marca..." 
                        value={filtro}
                        onChange={(e) => setFiltro(e.target.value)}
                    />
                </div>
                <span className="admin-config-counter-lbl">
                    Registros en pantalla: <strong className="admin-config-counter-total">{marcasFiltradas.length} marcas</strong>
                </span>
            </div>

            {/* FORM CONTAINER (FIJO - NO CRECE) */}
            <div className="admin-config-form-card">
                <div className="admin-config-flex-layout">
                    
                    <div className="admin-config-form-group-flex">
                        <label className="admin-config-label">
                            {marcaEditando ? "MODIFICAR NOMBRE DE LA MARCA:" : "NUEVA MARCA CORPORATIVA:"}
                        </label>
                        <input 
                            type="text" 
                            className="admin-config-input-brand"
                            placeholder="" 
                            value={marcaEditando ? marcaEditando.nombre_marca : nuevaMarca}
                            onChange={(e) => marcaEditando ? setMarcaEditando(p => ({ ...p, nombre_marca: e.target.value })) : setNuevaMarca(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    {marcaEditando ? (
                        <div className="admin-config-btn-group">
                            <button className="btn-pri admin-config-btn-save" onClick={handleGuardarEditar} disabled={isLoading}>
                                <i className="fas fa-check"></i>
                            </button>
                            <button className="btn-sec admin-config-btn-cancel" onClick={() => setMarcaEditando(null)} disabled={isLoading}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                    ) : (
                        <button 
                            className="admin-config-btn-add" 
                            onClick={handleAgregar} 
                            disabled={isLoading || !nuevaMarca.trim()}
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
                                <th className="admin-config-th-id">CÓDIGO ID</th>
                                <th className="admin-config-th-desc">NOMBRE DE LA MARCA</th>
                                <th className="admin-config-th-actions-brand">ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {marcasFiltradas.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="admin-config-empty-row">No se encontraron registros coincidentes.</td>
                                </tr>
                            ) : (
                                marcasFiltradas.map(m => (
                                    <tr key={m.id} className="admin-config-tbody-row">
                                        <td className="admin-config-td-id">{m.id}</td>
                                        <td className="admin-config-td-desc">{m.nombre_marca}</td>
                                        <td className="admin-config-td-actions">
                                            <div className="admin-config-actions-flex">
                                                <i className="fas fa-edit admin-config-icon-edit" onClick={() => setMarcaEditando(m)} title="Editar"></i>
                                                <i className="fas fa-trash-alt admin-config-icon-trash" onClick={() => handleEliminar(m.id)} title="Eliminar"></i>
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