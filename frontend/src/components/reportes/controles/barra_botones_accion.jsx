// src/components/reportes/modal_maestro/subcomponentes/controles/barra_botones_accion.jsx

export const BarraBotonesAccion = ({ 
    modoVista,          
    reporteHeader,      
    esEstadoBorrador,   
    isReadOnly,         
    isLoading,          
    isTiempoAgotado,    
    esAutorizador,      
    
    // Acciones Directas
    onExportar,
    onGuardarBorrador,
    onAutoAutorizar,
    
    // Disparador Universal de Modales
    onAbrirModal 
}) => {

    return (
        <div className="modal-footer mt-20">
            <button className="btn-sec" onClick={onExportar} disabled={isLoading}>
                <i className="fas fa-file-export"></i> EXPORTAR (PDF/EXCEL)
            </button>

            {modoVista === 'CREADOR' && reporteHeader?.id && esEstadoBorrador && (
                <button className="btn-sec btn-danger" onClick={() => onAbrirModal('ELIMINAR')} disabled={isLoading}>
                    <i className="fas fa-trash-alt"></i> ELIMINAR REPORTE
                </button>
            )}

            {modoVista === 'CREADOR' && reporteHeader?.estado === 'Pendiente de Autorización' && (
                <button className="btn-sec btn-danger" onClick={() => onAbrirModal('CANCELAR_ENVIO')} disabled={isLoading || isTiempoAgotado}>
                    <i className="fas fa-undo"></i> CANCELAR ENVÍO
                </button>
            )}

            {modoVista === 'CREADOR' && !isReadOnly && (
                <>
                    <button className="btn-sec btn-draft" onClick={onGuardarBorrador} disabled={isLoading || isTiempoAgotado}>
                        <i className="fas fa-save"></i> BORRADOR
                    </button>
                    
                    {esAutorizador && (
                        <button className="btn-pri btn-success" onClick={onAutoAutorizar} disabled={isLoading || isTiempoAgotado}>
                            <i className="fas fa-check-double"></i> AUTO-AUTORIZAR
                        </button>
                    )}
                    
                    <button className="btn-pri" onClick={() => onAbrirModal('BUSCAR_AUTORIZADOR')} disabled={isLoading || isTiempoAgotado}>
                        <i className="fas fa-paper-plane"></i> ENVIAR AL AUTORIZADOR
                    </button>
                </>
            )}

            {modoVista === 'JUEZ' && reporteHeader?.estado === 'Pendiente de Autorización' && (
                <>
                    <button className="btn-pri btn-danger-solid" onClick={() => onAbrirModal('DENEGAR_JUEZ')} disabled={isLoading || isTiempoAgotado}>
                        <i className="fas fa-times"></i> DENEGAR
                    </button>
                    <button className="btn-pri btn-success" onClick={() => onAbrirModal('APROBAR_JUEZ')} disabled={isLoading || isTiempoAgotado}>
                        <i className="fas fa-check"></i> AUTORIZAR REPORTE
                    </button>
                </>
            )}

            {modoVista === 'CONTADOR' && reporteHeader?.estado === 'Autorizado y Enviado a Contabilidad' && (
                <button className="btn-pri" onClick={() => onAbrirModal('VALIDAR_CONTADOR')} disabled={isLoading} style={{ backgroundColor: '#16a34a', color: 'white', border: 'none' }}>
                    <i className="fas fa-check-double"></i> VALIDAR REPORTE
                </button>
            )}

            {modoVista === 'ADMIN' && reporteHeader?.estado === 'Validado y Enviado a Planillas' && (
                <button className="btn-pri" onClick={() => onAbrirModal('RECIBIR_ADMIN')} disabled={isLoading} style={{ backgroundColor: '#0f172a', color: 'white', border: 'none' }}>
                    <i className="fas fa-check-circle"></i> RECIBIR EN PLANILLAS
                </button>
            )}
        </div>
    );
};