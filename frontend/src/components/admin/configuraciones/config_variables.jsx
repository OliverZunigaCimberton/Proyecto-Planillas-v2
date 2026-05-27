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
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '15px', fontFamily: 'system-ui', flex: 1, overflow: 'hidden' }}>
            
            {/* SEARCH & COUNTER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexShrink: 0 }}>
                <div style={{ position: 'relative', width: '340px' }}>
                    <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.85rem' }}></i>
                    <input 
                        type="text" 
                        style={{ width: '100%', height: '36px', paddingLeft: '36px', paddingRight: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none', background: '#ffffff', color: '#334155' }}
                        placeholder="Buscar por código contable o descripción..." 
                        value={filtro}
                        onChange={(e) => setFiltro(e.target.value)}
                    />
                </div>
                <span style={{ fontSize: '12.5px', color: '#475569', fontWeight: '500' }}>
                    Registros en pantalla: <strong style={{ color: '#0f172a', fontWeight: '700' }}>{variablesFiltradas.length} conceptos</strong>
                </span>
            </div>

            {/* FORM CARD (FIJO - NO CRECE) */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', background: '#ffffff', boxShadow: '0 1px 2px rgba(0,0,0,0.02)', flexShrink: 0 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 3fr auto', gap: '12px', alignItems: 'flex-end', width: '100%' }}>
                    
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '6px', letterSpacing: '0.5px' }}>
                            CÓDIGO VARIABLE:
                        </label>
                        <input 
                            type="text" 
                            style={{ width: '100%', height: '38px', padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', textTransform: 'uppercase', textAlign: 'center', fontWeight: '700', color: '#b91c1c', outline: 'none' }}
                            placeholder="" 
                            value={varEditando ? varEditando.codigo_variable : nuevoVarCodigo}
                            onChange={(e) => varEditando ? setVarEditando(p => ({ ...p, codigo_variable: e.target.value })) : setNuevoVarCodigo(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '6px', letterSpacing: '0.5px' }}>
                            DESCRIPCIÓN DEL CONCEPTO FINANCIERO:
                        </label>
                        <input 
                            type="text" 
                            style={{ width: '100%', height: '38px', padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', fontWeight: '600', color: '#334155', outline: 'none' }}
                            placeholder="" 
                            value={varEditando ? varEditando.nombre_variable : nuevoVarNombre}
                            onChange={(e) => varEditando ? setVarEditando(p => ({ ...p, nombre_variable: e.target.value })) : setNuevoVarNombre(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    {varEditando ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="btn-pri" style={{ height: '38px', width: '42px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', backgroundColor: '#10b981', border: 'none', color: '#fff', cursor: 'pointer' }} onClick={handleGuardarEditar} disabled={isLoading}>
                                <i className="fas fa-check"></i>
                            </button>
                            <button className="btn-sec" style={{ height: '38px', width: '42px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }} onClick={() => setVarEditando(null)} disabled={isLoading}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                    ) : (
                        <button 
                            style={{ height: '38px', width: '42px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', backgroundColor: '#0f172a', border: 'none', color: '#ffffff', cursor: 'pointer', fontWeight: '700' }} 
                            onClick={handleAgregar} 
                            disabled={isLoading || !nuevoVarCodigo.trim() || !nuevoVarNombre.trim()}
                        >
                            <i className="fas fa-plus"></i>
                        </button>
                    )}
                </div>
            </div>

            {/* 📊 ÁREA DE TABLA LIQUIDA RECOLECTORA (FLEX: 1 ABSOLUTO) */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, overflowY: 'auto', width: '100%', height: '100%' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', margin: 0 }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f8fafc' }}>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <th style={{ width: '22%', padding: '11px', fontSize: '11px', fontWeight: '700', color: '#475569', textAlign: 'center', letterSpacing: '0.3px' }}>CÓDIGO CONTABLE</th>
                                <th style={{ textAlign: 'left', padding: '11px 20px', fontSize: '11px', fontWeight: '700', color: '#475569', letterSpacing: '0.3px' }}>DESCRIPCIÓN DE LA VARIABLE CONTEBLE</th>
                                <th style={{ width: '15%', padding: '11px', fontSize: '11px', fontWeight: '700', color: '#475569', textAlign: 'center', letterSpacing: '0.3px' }}>ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {variablesFiltradas.length === 0 ? (
                                <tr>
                                    <td colSpan="3" style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '13px' }}>No se encontraron registros coincidentes.</td>
                                </tr>
                            ) : (
                                variablesFiltradas.map(v => (
                                    <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ textAlign: 'center', padding: '11px', fontSize: '13px', fontWeight: '800', color: '#b91c1c' }}>{v.codigo_variable}</td>
                                        <td style={{ textAlign: 'left', padding: '11px 20px', fontSize: '13px', fontWeight: '600', color: '#334155' }}>{v.nombre_variable}</td>
                                        <td style={{ textAlign: 'center', padding: '11px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                                                <i className="fas fa-edit" style={{ cursor: 'pointer', fontSize: '0.95rem', color: '#64748b' }} onClick={() => setVarEditando(v)} title="Editar"></i>
                                                <i className="fas fa-trash-alt" style={{ cursor: 'pointer', fontSize: '0.95rem', color: '#ef4444' }} onClick={() => handleEliminar(v.id)} title="Eliminar"></i>
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