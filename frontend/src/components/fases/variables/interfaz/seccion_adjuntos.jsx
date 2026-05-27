// src/components/reportes/modal_maestro/subcomponentes/interfaz/seccion_adjuntos.jsx

export const SeccionAdjuntos = ({ 
    isReadOnly, 
    isTiempoAgotado, 
    onDropArchivo, 
    onSeleccionarArchivos, 
    inputRef, 
    adjuntosExistentes, 
    archivosParaSubir,
    onEliminarAdjuntoExistente, // ✨ NUEVO
    onEliminarArchivoNuevo      // ✨ NUEVO
}) => {
    return (
        <div className="adjuntos-section">
            {!isReadOnly && !isTiempoAgotado && (
                <>
                    <div 
                        className="drop-zone" 
                        onDragOver={(e) => e.preventDefault()} 
                        onDrop={onDropArchivo}
                        onClick={() => inputRef.current?.click()}
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', minWidth: '54px', height: '42px', borderRadius: '6px' }}
                        title="Adjuntar Correo de Respaldo (.eml, .msg, .pdf)"
                    >
                        <i className="fas fa-envelope-open-text" style={{ fontSize: '1.5rem', color: 'var(--vino)', margin: 0 }}></i>
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

            {(adjuntosExistentes.length > 0 || archivosParaSubir.length > 0) && (
                <div className="file-list" style={{ marginTop: (isReadOnly || isTiempoAgotado) ? '0px' : '15px' }}>
                    {(isReadOnly || isTiempoAgotado) && (
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <i className="fas fa-paperclip" style={{ color: 'var(--vino)' }}></i> Respaldos Adjuntos:
                        </h4>
                    )}
                    
                    {adjuntosExistentes.map((adj, aIdx) => (
                        <div key={`existente-${aIdx}`} className="file-item-download" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <i className="fas fa-file-alt"></i>
                                <a href={adj.url} target="_blank" rel="noreferrer" className="text-dark no-underline font-bold" style={{ marginLeft: '6px' }}>
                                    {adj.nombre}
                                </a>
                            </div>
                            {!isReadOnly && !isTiempoAgotado && (
                                <i className="fas fa-times" style={{ color: '#cc0000', cursor: 'pointer', padding: '0 8px' }} onClick={() => onEliminarAdjuntoExistente(aIdx)}></i>
                            )}
                        </div>
                    ))}
                    
                    {archivosParaSubir.map((f, idx) => (
                        <div key={`nuevo-${idx}`} className="file-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <i className="fas fa-file-upload text-vino"></i> 
                                <span className="font-bold" style={{ marginLeft: '6px' }}>{f.name}</span>
                            </div>
                            {!isReadOnly && !isTiempoAgotado && (
                                <i className="fas fa-times" style={{ color: '#cc0000', cursor: 'pointer', padding: '0 8px' }} onClick={() => onEliminarArchivoNuevo(idx)}></i>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};