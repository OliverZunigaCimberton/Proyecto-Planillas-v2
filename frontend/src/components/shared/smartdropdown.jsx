// src/components/shared/smartdropdown.jsx
import { useState, useEffect, useRef } from 'react';

export const SmartAutocomplete = ({ 
    placeholder, 
    data = [], 
    displayKey, 
    searchKeys = [], // Llaves secundarias de búsqueda corporativa
    value, 
    onSelect, 
    disabled 
}) => {
    const [buscarTexto, setBuscarTexto] = useState(value || '');
    const [filtrados, setFiltrados] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        let isMounted = true;
        Promise.resolve().then(() => {
            if (isMounted) {
                setBuscarTexto(value || '');
            }
        });
        return () => { isMounted = false; };
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filtrarOpciones = (texto) => {
        if (!texto.trim()) {
            setFiltrados(data);
        } else {
            const t = texto.toLowerCase();
            const res = data.filter(item => {
                if (searchKeys.length > 0) {
                    return searchKeys.some(k => item[k]?.toString().toLowerCase().includes(t));
                }
                return item[displayKey]?.toString().toLowerCase().includes(t);
            });
            setFiltrados(res);
        }
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        setBuscarTexto(val);
        filtrarOpciones(val);
        setIsOpen(true);
    };

    const handleFocus = () => {
        if (disabled) return;
        filtrarOpciones(buscarTexto);
        setIsOpen(true);
    };

    const handleOptionClick = (item) => {
        setBuscarTexto(item[displayKey]);
        onSelect(item);
        setIsOpen(false);
    };

    return (
        <div className="relative-wrap" ref={containerRef} style={{ width: '100%', position: 'relative' }}>
            <input 
                type="text" 
                className="smart-input" 
                placeholder={placeholder}
                value={buscarTexto}
                onChange={handleInputChange}
                onFocus={handleFocus}
                disabled={disabled}
                autoComplete="off"
                style={{ width: '100%' }}
            />
            {isOpen && (
                <ul className="smart-dropdown-list" style={{ 
                    display: 'block', 
                    position: 'absolute', 
                    top: '100%', 
                    left: 0, 
                    width: '100%', 
                    zIndex: 99999, // Mantiene la prioridad de visualización sobre la tabla
                    maxHeight: '160px', 
                    overflowY: 'auto',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.18)',
                    background: '#ffffff',
                    border: '1px solid #cc0000', 
                    borderRadius: '4px',
                    margin: '2px 0 0 0',
                    padding: '0'
                }}>
                    {filtrados.length === 0 ? (
                        <li className="text-muted" style={{ padding: '6px 12px', fontSize: '12px', listStyle: 'none' }}>Sin resultados</li>
                    ) : (
                        filtrados.map((item, idx) => (
                            <li 
                                key={idx} 
                                onClick={() => handleOptionClick(item)}
                                style={{ padding: '6px 12px', cursor: 'pointer', fontSize: '12px', listStyle: 'none', borderBottom: '1px solid #f1f5f9' }}
                                // CORRECCIÓN: Se removió el color inline para permitir que InterfacesV.css controle el hover text-color
                            >
                                {item.codigo_variable ? `${item.codigo_variable} - ${item.nombre_variable || item.variable_nombre}` : item[displayKey]}
                            </li>
                        ))
                    )}
                </ul>
            )}
        </div>
    );
};