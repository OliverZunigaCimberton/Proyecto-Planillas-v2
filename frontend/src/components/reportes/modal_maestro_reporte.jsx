// src/components/reportes/modal_maestro_reporte.jsx
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '../../hooks/useauth';
import { exportarReporteAExcel, exportarReporteAPDF } from '../../utils/exportutils';
import { api } from '../../services/api';

// --- 1. Hooks de Lógica ---
import { useApiReporte } from './logica/use_api_reporte';
import { useCalculosTotales } from './logica/use_calculos_totales';
import { useProcesadorExcel } from './logica/use_procesador_excel';

// --- 2. Subcomponentes Visuales ---
import { EncabezadoFormulario } from './interfaz/encabezado_formulario';
import { TablaVariables } from './interfaz/tabla_variables';
import { SeccionFirmas } from './interfaz/seccion_firmas';
import { SeccionAdjuntos } from './interfaz/seccion_adjuntos';

// --- 3. Controles y Modales ---
import { BarraBotonesAccion } from './controles/barra_botones_accion';
import { ControlesCargaMasiva } from './controles/controles_carga_masiva';
import { OrquestadorModales } from './modales_alerta/orquestador_modales';

const formatoMoneda = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatearFecha = (fechaStr) => {
    if (!fechaStr) return "--/--/--";
    const [y, m, d] = fechaStr.split('T')[0].split('-');
    return `${d.substring(0, 2)}/${m}/${y.slice(-2)}`;
};

export const ModalMaestroReporte = ({ 
    idReporte, periodoActivo, periodoSeleccionado, catalogos, onClose, onRefreshBandeja, modoVista = 'CREADOR' 
}) => {
    const { user } = useAuth();
    const adjuntosInputRef = useRef(null);

    // --- ESTADOS LOCALES ---
    const [modalActivo, setModalActivo] = useState(null);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [hayCambios, setHayCambios] = useState(false);

    // Estado para la alerta estética (ahora viaja por props)
    const [alertaEmergente, setAlertaEmergente] = useState({ activa: false, mensaje: '' });

    const [reporteHeader, setReporteHeader] = useState({
        id: null, codigo_usuario: '', fecha: '', marca: '', id_marca: '', cargo_a_marca: '', centro_costo: '', nombre_cc_descriptivo: '', id_cc: '', estado: 'Borrador'
    });

    const [lineas, setLineas] = useState([]);
    const [firmas, setFirmas] = useState({ elaborado: '', autorizado: '', contabilizado: '', recepcionado: '' });
    
    const [adjuntosExistentes, setAdjuntosExistentes] = useState([]);
    const [archivosParaSubir, setArchivosParaSubir] = useState([]);

    const [codigoAuthBusca, setCodigoAuthBusca] = useState('');
    const [autorizadorEncontrado, setAutorizadorEncontrado] = useState(null);

    // --- INTEGRACIÓN DE CUSTOM HOOKS ---
    const { 
        isLoading, cargarDetallesAPI, guardarFlujoAPI, cancelarEnvioAPI, 
        eliminarBorradorAPI, accionJuezAPI, accionContadorAPI, accionAdminAPI,
        buscarAutorizadorAPI, buscarEmpleadoRowAPI
    } = useApiReporte(user);

    const { descargarPlantilla, procesarCargaMasiva } = useProcesadorExcel();
    const { subtotal, montoCargoMarca, totalGeneral } = useCalculosTotales(lineas, reporteHeader.cargo_a_marca);

    // Función para invocar la alerta desde cualquier lugar de este archivo
    const mostrarAlerta = (mensaje) => {
        setAlertaEmergente({ activa: true, mensaje });
    };

    const inicializarFilaVacia = useCallback(() => {
        return { id_temp: Math.random(), codigo_empleado: '', empleado_nombre: '', empleado_puesto: '', monto: '', codigo_variable: '', id_variable: '', nombre_variable: '' };
    }, []);

    const perActual = catalogos?.periodos?.find(p => String(p.id) === String(periodoSeleccionado || periodoActivo?.id)) || periodoActivo;
    
    // --- ESTADOS DE EXCEPCIÓN ---
    const [listaExcepciones, setListaExcepciones] = useState([]);
    const [excepcionLocal, setExcepcionLocal] = useState(null);

    useEffect(() => {
        const verificarExcepciones = async () => {
            const idPeriodo = periodoSeleccionado || periodoActivo?.id;
            if (!idPeriodo || !user?.codigo) {
                setListaExcepciones([]);
                return;
            }
            try {
                const res = await api.shared.getExcepcionActiva(idPeriodo, user.codigo);
                setListaExcepciones(res?.data || []);
            } catch (error) {
                console.error("Error consultando tiempo de gracia en modal:", error);
                setListaExcepciones([]);
            }
        };
        verificarExcepciones();
    }, [periodoSeleccionado, periodoActivo, user?.codigo]);

    const isTiempoAgotado = useMemo(() => {
        if (!perActual) return false;
        
        const estadoActual = perActual.estado?.toString().trim().toUpperCase();
        if (estadoActual === 'CERRADO' || estadoActual === 'INACTIVO') return true;
        
        let globalExpirado = false;
        if (perActual.fecha_corte && perActual.hora_corte) {
            const finGlobal = new Date(`${perActual.fecha_corte}T${perActual.hora_corte}`).getTime();
            globalExpirado = new Date().getTime() > finGlobal;
        }

        if (!globalExpirado) return false;

        let excAplicable = null;

        if (modoVista === 'CREADOR') {
            excAplicable = listaExcepciones.find(e => 
                String(e.codigo_empleado) === String(user?.codigo) && 
                (e.tipo_permiso || 'CREAR') === 'CREAR'
            );
        } else if (modoVista === 'JUEZ') {
            if (excepcionLocal) {
                excAplicable = excepcionLocal;
            } else {
                excAplicable = listaExcepciones.find(e => 
                    String(e.codigo_autorizador) === String(user?.codigo) &&
                    e.tipo_permiso === 'AUTORIZAR'
                );
            }
        }

        if (excAplicable && excAplicable.nueva_fecha_corte) {
            const finGracia = new Date(`${excAplicable.nueva_fecha_corte.split('T')[0]}T${excAplicable.nueva_hora_corte.substring(0, 8)}`).getTime();
            return new Date().getTime() > finGracia; 
        }

        return true;
    }, [perActual, modoVista, listaExcepciones, excepcionLocal, user]);

    // --- CARGA INICIAL DE DATOS ---
    useEffect(() => {
        const cargarData = async () => {
            if (!idReporte) {
                const hoy = new Date();
                setReporteHeader(prev => ({ ...prev, fecha: `${String(hoy.getDate()).padStart(2, '0')}/${String(hoy.getMonth() + 1).padStart(2, '0')}/${hoy.getFullYear()}` }));
                setLineas(isTiempoAgotado ? [] : [inicializarFilaVacia()]);
                setFirmas({ elaborado: user?.nombre || '', autorizado: '', contabilizado: '', recepcionado: '' });
                return;
            }

            const result = await cargarDetallesAPI(idReporte, modoVista);
            if (result && result.success) {
                const rep = result.reporte;
                const dbLineas = result.lineas || [];
                const dbEmpleados = result.empleados || [];
                const dbFirmantes = result.firmantes || [];
                
                setExcepcionLocal(result.excepcion || null);

                const ccEncontrado = catalogos.centrosCosto.find(c => String(c.id) === String(dbLineas[0]?.id_cc));

                // ✨ CORRECCIÓN: Procesamos la fecha como texto puro para evitar desfases de zona horaria
                const rawFecha = rep.fecha_envio || rep.fecha_creacion || '';
                let fechaInmune = '--/--/----';
                if (rawFecha) {
                    const parteFecha = rawFecha.split('T')[0].split(' ')[0]; // Aísla estrictamente YYYY-MM-DD
                    const [anio, mes, dia] = parteFecha.split('-');
                    if (anio && mes && dia) {
                        fechaInmune = `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${anio}`;
                    }
                }

                setReporteHeader({
                    id: rep.id,
                    codigo_usuario: rep.codigo_usuario,
                    fecha: fechaInmune,
                    marca: rep.marca || '',
                    id_marca: catalogos.marcas.find(m => m.nombre_marca === rep.marca)?.id || '',
                    cargo_a_marca: dbLineas[0]?.cargo_a_marca || 'No',
                    centro_costo: ccEncontrado?.nomenclatura_cc || '',
                    nombre_cc_descriptivo: ccEncontrado?.nombre_cc || ccEncontrado?.descripcion || '',
                    id_cc: dbLineas[0]?.id_cc || '',
                    estado: rep.estado
                });

                setAdjuntosExistentes(rep.adjuntos || []);

                const lineasMapeadas = dbLineas.map(lin => {
                    const emp = dbEmpleados.find(e => String(e.codigo_empleado) === String(lin.codigo_empleado));
                    const v = catalogos.variables.find(varItem => String(varItem.id) === String(lin.id_variable));
                    return {
                        id_temp: Math.random(),
                        codigo_empleado: lin.codigo_empleado || '',
                        empleado_nombre: emp ? emp.nombres_apellidos : 'NO ENCONTRADO',
                        empleado_puesto: emp ? emp.puesto : '-',
                        monto: formatoMoneda.format(lin.monto || 0),
                        codigo_variable: v?.codigo_variable || '',
                        id_variable: lin.id_variable || '',
                        nombre_variable: v?.nombre_variable || ''
                    };
                });

                const readOnlyStatus = (modoVista === 'JUEZ' || modoVista === 'CONTADOR' || modoVista === 'ADMIN') 
                    ? true 
                    : (rep.estado !== 'Guardado en borrador' && rep.estado !== 'Denegado') || (modoVista === 'CREADOR' && isTiempoAgotado);
                
                setIsReadOnly(readOnlyStatus);
                if (!readOnlyStatus && !isTiempoAgotado) lineasMapeadas.push(inicializarFilaVacia());
                setLineas(lineasMapeadas);

                const reqAuth = !['Guardado en borrador', 'Borrador', 'Denegado', 'Pendiente de Autorización'].includes(rep.estado);
                setFirmas({
                    elaborado: dbFirmantes.find(f => String(f.codigo) === String(rep.codigo_usuario))?.nombre || '',
                    autorizado: reqAuth ? (dbFirmantes.find(f => String(f.codigo) === String(rep.codigo_autorizador))?.nombre || '') : '',
                    contabilizado: dbFirmantes.find(f => String(f.codigo) === String(rep.codigo_contador))?.nombre || '',
                    recepcionado: dbFirmantes.find(f => String(f.codigo) === String(rep.codigo_recepcion))?.nombre || ''
                });
            }
        };
        cargarData();
    }, [idReporte, catalogos, user, inicializarFilaVacia, modoVista, isTiempoAgotado, cargarDetallesAPI]);

    // --- MANEJADORES ---
    const handleLineaChange = useCallback((index, campo, valor) => {
        setHayCambios(true);
        setLineas(prev => {
            const nuevas = [...prev];
            nuevas[index] = { ...nuevas[index], [campo]: campo === 'codigo_empleado' ? String(valor).replace(/\D/g, '') : valor };
            return nuevas;
        });
    }, []);

    const handleEmpleadoBlur = useCallback(async (index, code) => {
        if (idReporte) { 
            mostrarAlerta('Por seguridad e integridad, no se puede modificar el personal una vez creado el borrador del reporte.'); 
            return; 
        }
        const targetCode = String(code).trim();
        if (!targetCode) return;
        handleLineaChange(index, 'empleado_nombre', 'Buscando...');
        const emp = await buscarEmpleadoRowAPI(targetCode, perActual?.id);
        if (emp) {
            handleLineaChange(index, 'empleado_nombre', emp.nombres_apellidos);
            handleLineaChange(index, 'empleado_puesto', emp.puesto);
        } else {
            handleLineaChange(index, 'empleado_nombre', 'NO ENCONTRADO');
            handleLineaChange(index, 'empleado_puesto', '-');
        }
    }, [idReporte, perActual, buscarEmpleadoRowAPI, handleLineaChange]);

    const handleMontoBlur = useCallback((index) => {
        setLineas(prev => {
            const nuevas = [...prev];
            const val = String(nuevas[index].monto);
            if (val.trim() !== '') {
                nuevas[index] = { ...nuevas[index], monto: formatoMoneda.format(parseFloat(val.replace(/[^0-9.-]+/g, '')) || 0) };
                if (index === prev.length - 1 && nuevas[index].codigo_empleado && nuevas[index].id_variable && !isTiempoAgotado) {
                    nuevas.push(inicializarFilaVacia());
                }
            }
            return nuevas;
        });
    }, [isTiempoAgotado, inicializarFilaVacia]);

    const handleEliminarFila = useCallback((index) => {
        setHayCambios(true);
        setLineas(prev => prev.filter((_, idx) => idx !== index).length === 0 ? [inicializarFilaVacia()] : prev.filter((_, idx) => idx !== index));
    }, [inicializarFilaVacia]);

    const handleCargaMasiva = async (e) => {
        const file = e.target.files[0];
        if (!file || isTiempoAgotado) return;
        
        const result = await procesarCargaMasiva(file, catalogos, perActual?.id, formatoMoneda);
        
        if (result.success) { 
            setLineas([...result.data, inicializarFilaVacia()]); 
            setHayCambios(true); 
        } else { 
            mostrarAlerta(result.error); 
        }
        e.target.value = '';
    };

    const ejecutarGuardar = async (estadoDeseado) => {
        if (isTiempoAgotado) return mostrarAlerta("El periodo ha finalizado y el tiempo de gracia expiró.");
        
        // 1. Validación de Cabecera
        if (!reporteHeader.id_marca || !reporteHeader.id_cc || !reporteHeader.cargo_a_marca) {
            return mostrarAlerta("Campos incompletos: Por favor seleccione la Marca, el Centro de Costo y si aplica Cargo a Marca.");
        }

        // ✨ 2. ESCUDO DE VALIDACIÓN PARA LA TABLA DE VARIABLES
        // Filtramos la fila en blanco automática y nos quedamos solo con las que el usuario escribió
        const lineasLlenas = lineas.filter(l => l.codigo_empleado && String(l.codigo_empleado).trim() !== '');

        if (lineasLlenas.length === 0) {
            return mostrarAlerta("El reporte está vacío. Debes ingresar al menos un empleado válido con sus variables antes de proceder.");
        }

        // A) Buscamos empleados inexistentes
        const hayEmpleadosInvalidos = lineasLlenas.some(l => l.empleado_nombre === 'NO ENCONTRADO' || l.empleado_nombre === 'Buscando...');
        if (hayEmpleadosInvalidos) {
            return mostrarAlerta("Existen códigos de empleado marcados como 'NO ENCONTRADO'. Por favor, corrígelos o elimina la fila con el ícono de basura.");
        }

        // B) Buscamos que no se les haya olvidado elegir la Variable
        const hayVariablesVacias = lineasLlenas.some(l => !l.id_variable);
        if (hayVariablesVacias) {
            return mostrarAlerta("Existen empleados a los que no se les ha asignado una variable (motivo). Verifica la lista.");
        }

        // C) Buscamos montos en cero o vacíos
        const hayMontosInvalidos = lineasLlenas.some(l => {
            const montoNumerico = parseFloat(String(l.monto).replace(/[^0-9.-]+/g, '')) || 0;
            return montoNumerico <= 0;
        });
        if (hayMontosInvalidos) {
            return mostrarAlerta("Todos los empleados listados deben tener un monto válido mayor a cero.");
        }

        // 3. Si todo está perfecto, procedemos a guardar o enviar
        const res = await guardarFlujoAPI({
            estadoDeseado, 
            autorizadorId: estadoDeseado === 'Pendiente de Autorización' ? codigoAuthBusca : (estadoDeseado === 'Autorizado y Enviado a Contabilidad' ? user?.codigo : null),
            reporteHeader, lineas, totalGeneral, targetPeriodoId: perActual?.id, adjuntosExistentes, archivosParaSubir
        });

        if (res.success) { 
            setHayCambios(false); 
            onRefreshBandeja(); 
            onClose(); 
        } else { 
            mostrarAlerta(res.error); 
        }
    };

    const handleExportar = async () => {
        const mockRep = { ...reporteHeader, periodo_lbl: perActual ? `${formatearFecha(perActual.fecha_desde)} - ${formatearFecha(perActual.fecha_hasta)}` : 'N/A', centro_costo_lbl: `${reporteHeader.centro_costo} - ${reporteHeader.nombre_cc_descriptivo}`, creador_nombre: firmas.elaborado, autorizador_nombre: firmas.autorizado, contador_nombre: firmas.contabilizado, recepcion_nombre: firmas.recepcionado };
        exportarReporteAExcel(mockRep, lineas.filter(l => l.codigo_empleado), [], user?.rol);
        await new Promise(res => setTimeout(res, 350)); 
        exportarReporteAPDF(mockRep, lineas.filter(l => l.codigo_empleado), [], user?.rol);
    };

    return (
        <div className="modal-overlay" style={{ display: 'flex' }}>
            <div className="modal-content modal-reporte-lg">
                <div className="modal-header-box">
                    <h3>{reporteHeader.id ? `Reporte RV-${String(reporteHeader.id).padStart(5, '0')}` : 'Nuevo Reporte'}</h3>
                    <div className="modal-header-actions">
                        <ControlesCargaMasiva isLoading={isLoading} isReadOnly={isReadOnly} isTiempoAgotado={isTiempoAgotado} onDescargarPlantilla={descargarPlantilla} onCargarExcel={handleCargaMasiva} />
                        <i className="fas fa-times close-modal" onClick={() => hayCambios ? setModalActivo('CAMBIOS_SIN_GUARDAR') : onClose()} style={{ cursor: 'pointer' }}></i>
                    </div>
                </div>
                <div className="reporte-body">
                    <EncabezadoFormulario reporteHeader={reporteHeader} setReporteHeader={setReporteHeader} periodoActivo={perActual} catalogos={catalogos} isReadOnly={isReadOnly} isLoading={isLoading} isTiempoAgotado={isTiempoAgotado} formatearFecha={formatearFecha} />
                    <TablaVariables lineas={lineas} isReadOnly={isReadOnly} isLoading={isLoading} isTiempoAgotado={isTiempoAgotado} catalogos={catalogos} cargoAMarca={reporteHeader.cargo_a_marca} subtotal={subtotal} montoCargoMarca={montoCargoMarca} totalGeneral={totalGeneral} formatoMoneda={formatoMoneda} onChangeLinea={handleLineaChange} onBlurEmpleado={handleEmpleadoBlur} onBlurMonto={handleMontoBlur} onEliminarFila={handleEliminarFila} />
                    <SeccionFirmas firmas={firmas} />
                </div>
                <SeccionAdjuntos 
                isReadOnly={isReadOnly} 
                isTiempoAgotado={isTiempoAgotado} 
                onDropArchivo={(e) => { e.preventDefault(); if(!isReadOnly && !isTiempoAgotado) { setArchivosParaSubir(p => [...p, ...Array.from(e.dataTransfer.files)]); setHayCambios(true); } }} 
                onSeleccionarArchivos={(e) => { if(!isReadOnly && !isTiempoAgotado) { setArchivosParaSubir(p => [...p, ...Array.from(e.target.files)]); setHayCambios(true); } e.target.value = ''; }} 
                inputRef={adjuntosInputRef} 
                adjuntosExistentes={adjuntosExistentes} 
                archivosParaSubir={archivosParaSubir} 
                onEliminarAdjuntoExistente={(idx) => { setAdjuntosExistentes(prev => prev.filter((_, i) => i !== idx)); setHayCambios(true); }}
                onEliminarArchivoNuevo={(idx) => { setArchivosParaSubir(prev => prev.filter((_, i) => i !== idx)); setHayCambios(true); }}
            />
                <BarraBotonesAccion modoVista={modoVista} reporteHeader={reporteHeader} esEstadoBorrador={['Guardado en borrador', 'Borrador'].includes(reporteHeader.estado)} isReadOnly={isReadOnly} isLoading={isLoading} isTiempoAgotado={isTiempoAgotado} esAutorizador={user?.rol?.toUpperCase() === 'AUTORIZADOR'} onExportar={handleExportar} onGuardarBorrador={() => ejecutarGuardar('Guardado en borrador')} onAutoAutorizar={() => ejecutarGuardar('Autorizado y Enviado a Contabilidad')} onAbrirModal={setModalActivo} />
            </div>
            
            {/* ✨ COMPONENTE CENTRALIZADO QUE AHORA INCLUYE LA ALERTA */}
            <OrquestadorModales 
                modalActivo={modalActivo} 
                setModalActivo={setModalActivo} 
                isTiempoAgotado={isTiempoAgotado} 
                alertaEmergente={alertaEmergente} 
                setAlertaEmergente={setAlertaEmergente}
                codigoAuthBusca={codigoAuthBusca} 
                setCodigoAuthBusca={setCodigoAuthBusca} 
                autorizadorEncontrado={autorizadorEncontrado} 
                onBuscarAutorizador={async () => setAutorizadorEncontrado(await buscarAutorizadorAPI(codigoAuthBusca))} 
                onGuardarBorrador={() => ejecutarGuardar('Guardado en borrador')} 
                onSalirSinGuardar={onClose} 
                onCancelarEnvio={async () => { await cancelarEnvioAPI(reporteHeader.id); onRefreshBandeja(); onClose(); }} 
                onEliminarReporte={async () => { await eliminarBorradorAPI(reporteHeader.id); onRefreshBandeja(); onClose(); }} 
                onEnviarAutorizador={() => ejecutarGuardar('Pendiente de Autorización')} 
                onAccionJuez={async (accion) => { await accionJuezAPI(reporteHeader.id, accion); onRefreshBandeja(); onClose(); }} 
                onAccionContador={async () => { await accionContadorAPI(reporteHeader.id); onRefreshBandeja(); onClose(); }} 
                onAccionAdmin={async () => { await accionAdminAPI(reporteHeader.id); onRefreshBandeja(); onClose(); }} 
            />
        </div>
    );
};