// src/components/reportes/modal_maestro/subcomponentes/interfaz/seccion_adjuntos.jsx
export const SeccionAdjuntos = ({ 
    isReadOnly, 
    isTiempoAgotado, 
    onDropArchivo, 
    onSeleccionarArchivos, 
    inputRef, 
    adjuntosExistentes, 
    archivosParaSubir,
    onEliminarAdjuntoExistente,
    onEliminarArchivoNuevo
}) => {
    return (
        <div className="adjuntos-section" style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
            {/* 1. Botón para Soltar/Subir Archivo (Fijo y pequeño) */}
            {!isReadOnly && !isTiempoAgotado && (
                <>
                    <div 
                        className="drop-zone" 
                        onDragOver={(e) => e.preventDefault()} 
                        onDrop={onDropArchivo}
                        onClick={() => inputRef.current?.click()}
                        style={{ 
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            width: '42px', minWidth: '42px', maxWidth: '42px', flexGrow: 0, padding: 0, height: '38px', 
                            borderRadius: '8px', background: '#fff5f5', border: '1px dashed var(--vino)', flexShrink: 0
                        }}
                        title="Adjuntar Correo de Respaldo (.eml, .msg, .pdf)"
                    >
                        <i className="fas fa-envelope-open-text" style={{ fontSize: '1.2rem', color: 'var(--vino)', margin: 0 }}></i>
                    </div>
                    <input 
                        type="file" 
                        ref={inputRef} 
                        style={{ display: 'none' }} 
                        multiple 
                        accept=".eml,.msg,.pdf" 
                        onChange={onSeleccionarArchivos} 
                    />
                </>
            )}

            {/* 2. Contenedor de Archivos */}
            {(adjuntosExistentes.length > 0 || archivosParaSubir.length > 0) && (
                <div className="file-list" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, flexWrap: 'nowrap' }}>
                    
                    {/* ✨ NUEVO: Etiqueta descriptiva antes de los archivos (Oculta en edición/borrador) */}
                    {(isReadOnly || isTiempoAgotado) && (
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <i className="fas fa-paperclip" style={{ color: 'var(--vino)' }}></i>
                            Correos Adjuntos:
                        </span>
                    )}

                    {/* Archivos Existentes */}
                    {adjuntosExistentes.map((adj, aIdx) => (
                        <div 
                            key={`existente-${aIdx}`} 
                            style={{ 
                                display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#e2e8f0', 
                                padding: '4px 8px', borderRadius: '6px', height: '38px', border: '1px solid #cbd5e1'
                            }}
                            title={`Click para descargar/ver: ${adj.nombre}`}
                        >
                            <a 
                                href={adj.url} 
                                target="_blank" 
                                rel="noreferrer" 
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#0f172a', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.8rem' }}
                            >
                                <i className="fas fa-file-alt" style={{ color: 'var(--vino)' }}></i>
                                {/* ✨ NUEVO: Nombre restaurado con límite de ancho (150px) y puntos suspensivos */}
                                <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {adj.nombre}
                                </span>
                            </a>

                            {!isReadOnly && !isTiempoAgotado && (
                                <i 
                                    className="fas fa-times" 
                                    style={{ color: '#cc0000', cursor: 'pointer', fontSize: '0.8rem', paddingLeft: '2px' }} 
                                    onClick={() => onEliminarAdjuntoExistente(aIdx)}
                                    title="Eliminar adjunto"
                                ></i>
                            )}
                        </div>
                    ))}

                    {/* Archivos Nuevos */}
                    {archivosParaSubir.map((f, idx) => (
                        <div 
                            key={`nuevo-${idx}`} 
                            style={{ 
                                display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fee2e2', 
                                padding: '4px 8px', borderRadius: '6px', height: '38px', border: '1px solid #fca5a5'
                            }}
                            title={`Pendiente de subir: ${f.name}`}
                        >
                            <i className="fas fa-file-upload" style={{ color: '#cc0000', fontSize: '0.85rem' }}></i>
                            {/* ✨ NUEVO: Nombre restaurado con límite de ancho */}
                            <span style={{ fontWeight: 'bold', fontSize: '0.78rem', color: '#991b1b', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {f.name}
                            </span>

                            {!isReadOnly && !isTiempoAgotado && (
                                <i 
                                    className="fas fa-times" 
                                    style={{ color: '#cc0000', cursor: 'pointer', fontSize: '0.8rem', paddingLeft: '2px' }} 
                                    onClick={() => onEliminarArchivoNuevo(idx)}
                                    title="Quitar de la lista"
                                ></i>
                            )}
                        </div>
                    ))}

                </div>
            )}
        </div>
    );
};