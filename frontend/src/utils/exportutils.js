// src/utils/exportutils.js
import logoCimsa from "../styles/logos/cimsa.png";
import logoDietco from "../styles/logos/dietco.png";
import logoSq from "../styles/logos/sq.png";

const formatoMoneda = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

const formatearFechaResumida = (fechaStr) => {
    if (!fechaStr) return "--/--/--";
    const fechaLimpia = fechaStr.split('T')[0];
    const [year, month, day] = fechaLimpia.split('-');
    return `${day}/${month}/${year.slice(-2)}`;
};

/**
 * =========================================================================
 * EXPORTACIÓN EXCEL CORPORATIVO - UNA SOLA HOJA (SIN PAGINACIÓN)
 * =========================================================================
 */
export const exportarReporteAExcel = (reporte, lineas, firmantes = [], userRol = '') => {
    if (!reporte || !lineas || lineas.length === 0) return;

    const rolFormateado = (userRol || reporte.userRol || 'REPORTANTE').toUpperCase();
    const numeroPadded = reporte.id ? String(reporte.id).padStart(5, '0') : '00000';
    const codigoUnicoInterno = reporte.id ? `RV-${numeroPadded}` : 'S/N';
    const nombreArchivoFinal = `${rolFormateado} RV${numeroPadded}`;

    const repPeriodo = reporte.periodo_lbl || '--/--/--';
    const repFecha = reporte.fecha || formatearFechaResumida(reporte.fecha_envio || reporte.fecha_creacion);
    const repMarca = reporte.marca || '-';
    const repCargo = reporte.cargo_a_marca || 'No';
    const repCC = reporte.centro_costo_lbl || '-';

    let subtotalFloat = 0;
    lineas.forEach(lin => {
        const val = parseFloat(String(lin.monto).replace(/[^0-9.-]+/g, '')) || 0;
        subtotalFloat += val;
    });
    const extraFloat = subtotalFloat * 0.1725;
    const tgFloat = subtotalFloat + extraFloat;

    const nCreador = reporte.creador_nombre || firmantes.find(f => String(f.codigo) === String(reporte.codigo_usuario))?.nombre || '-';
    const nAutoriza = reporte.autorizador_nombre || '';
    const nContador = reporte.contador_nombre || '';
    const nRecepcion = reporte.recepcion_nombre || '';

    let html = `
        <style>
            .th-rojo { background-color: #cc0000; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #000000; font-family: 'Segoe UI', Arial; font-size: 9.5pt; padding: 4px 6px; }
            .td-center { text-align: center; border: 1px solid #cbd5e1; font-family: 'Segoe UI', Arial; font-size: 10pt; padding: 4px; }
            .td-monto { text-align: right; border: 1px solid #cbd5e1; font-weight: bold; background-color: #e2e8f0; font-family: 'Segoe UI', Arial; font-size: 10pt; color: #cc0000; padding: 4px; }
            .header-label { font-weight: bold; color: #cc0000; font-family: 'Segoe UI', Arial; font-size: 10pt; text-transform: uppercase; }
            
            .total-label { background-color: #cc0000; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #000000; font-family: 'Segoe UI', Arial; font-size: 8.5pt; padding: 2px 4px; }
            .total-val { background-color: #ffffff; color: #cc0000; font-weight: bold; text-align: right; border: 1px solid #cc0000; font-family: 'Segoe UI', Arial; font-size: 8.5pt; padding: 2px 4px; }
            .cargo-label { background-color: #f59e0b; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #000000; font-family: 'Segoe UI', Arial; font-size: 8.5pt; padding: 2px 4px; }
            .cargo-val { background-color: #ffffff; color: #f59e0b; font-weight: bold; text-align: right; border: 1px solid #f59e0b; font-family: 'Segoe UI', Arial; font-size: 8.5pt; padding: 2px 4px; }
            .tg-label { background-color: #800020; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #000000; font-family: 'Segoe UI', Arial; font-size: 8.5pt; padding: 2px 4px; }
            .tg-val { background-color: #ffffff; color: #800020; font-weight: bold; text-align: right; border: 1px solid #800020; font-family: 'Segoe UI', Arial; font-size: 8.5pt; padding: 2px 4px; }
        </style>
    `;

    html += `
    <table border="0" cellpadding="3.5">
        <colgroup>
            <col style="width: 70px;" />
            <col style="width: 280px;" />
            <col style="width: 200px;" />
            <col style="width: 70px;" />
            <col style="width: 260px;" />
            <col style="width: 120px;" />
        </colgroup>
        
        <tr><td colspan="6" style="text-align:center; font-size: 16pt; font-weight:bold; font-family: 'Segoe UI', Arial; color: #000000;">REPORTE DE COMISIONES, PREMIOS Y BONIFICACIONES</td></tr>
        <tr><td colspan="6" style="text-align:center; font-weight:bold; color:#cc0000; font-family: 'Segoe UI', Arial; font-size: 12pt;">CÓDIGO: ${codigoUnicoInterno}</td></tr>
        <tr><td colspan="6"></td></tr>
        <tr>
            <td colspan="2" class="header-label">PERIODO DE PLANILLA:</td><td colspan="2" style="text-align:center; border-bottom: 1px solid #000000; font-family: 'Segoe UI'; font-size: 10pt;">${repPeriodo}</td>
            <td class="header-label" style="text-align:right;">FECHA:</td><td style="text-align:center; border-bottom: 1px solid #000000; font-family: 'Segoe UI'; font-size: 10pt;">${repFecha}</td>
        </tr>
        <tr>
            <td colspan="2" class="header-label">MARCA:</td><td colspan="2" style="text-align:center; border-bottom: 1px solid #000000; font-family: 'Segoe UI'; font-size: 10pt;">${repMarca}</td>
            <td class="header-label" style="text-align:right;">CARGO A MARCA:</td><td style="text-align:center; border-bottom: 1px solid #000000; font-family: 'Segoe UI'; font-size: 10pt;">${repCargo}</td>
        </tr>
        <tr>
            <td colspan="2" class="header-label">CENTRO DE COSTO:</td><td colspan="4" style="text-align:left; border-bottom: 1px solid #000000; font-family: 'Segoe UI'; font-size: 10pt;">${repCC}</td>
        </tr>
        <tr><td colspan="6"></td></tr>
        
        <tr>
            <th class="th-rojo">CÓDIGO</th>
            <th class="th-rojo">NOMBRE EMPLEADO</th>
            <th class="th-rojo">PUESTO</th>
            <th class="th-rojo">CÓD. VAR</th>
            <th class="th-rojo">NOMBRE VARIABLE</th>
            <th class="th-rojo" style="background-color:#cbd5e1; color:#000000;">MONTO</th>
        </tr>
    `;

    lineas.forEach(lin => {
        const valM = parseFloat(String(lin.monto).replace(/[^0-9.-]+/g, '')) || 0;
        html += `
            <tr>
                <td class="td-center" style="border: 1px solid #cbd5e1;">${lin.codigo_empleado}</td>
                <td style="border: 1px solid #cbd5e1; font-family: 'Segoe UI'; font-size: 10pt; text-align: left;">${lin.empleado_nombre || lin.nombres_apellidos || 'No encontrado'}</td>
                <td style="border: 1px solid #cbd5e1; font-family: 'Segoe UI'; font-size: 10pt; text-align: left;">${lin.empleado_puesto || lin.puesto || '-'}</td>
                <td class="td-center" style="border: 1px solid #cbd5e1;">${lin.codigo_variable || ''}</td>
                <td style="border: 1px solid #cbd5e1; font-family: 'Segoe UI'; font-size: 10pt; text-align: left;">${lin.nombre_variable || ''}</td>
                <td class="td-monto">$ ${formatoMoneda.format(valM)}</td>
            </tr>
        `;
    });

    html += `<tr><td colspan="6" style="height: 6px;"></td></tr>`;
    
    if (repCargo === 'Si') {
        html += `
            <tr><td colspan="3" style="border:none; background:transparent;"></td><td colspan="2" class="total-label">SUB TOTAL</td><td class="total-val">$ ${formatoMoneda.format(subtotalFloat)}</td></tr>
            <tr><td colspan="3" style="border:none; background:transparent;"></td><td colspan="2" class="cargo-label">MÁS CARGO A MARCA (17.25%)</td><td class="cargo-val">$ ${formatoMoneda.format(extraFloat)}</td></tr>
            <tr><td colspan="3" style="border:none; background:transparent;"></td><td colspan="2" class="tg-label">TOTAL REPORTE</td><td class="tg-val">$ ${formatoMoneda.format(tgFloat)}</td></tr>
        `;
    } else {
        html += `
            <tr><td colspan="3" style="border:none; background:transparent;"></td><td colspan="2" class="total-label">TOTAL REPORTE</td><td class="total-val">$ ${formatoMoneda.format(subtotalFloat)}</td></tr>
        `;
    }

    html += `
        <tr><td colspan="6"></td></tr>
        <tr><td colspan="6"></td></tr>
        <tr>
            <td colspan="1" style="text-align:center; vertical-align:bottom; font-family: 'Segoe UI'; font-size: 9pt; font-weight: bold;">ELABORADO POR:<br><span style="color:#475569;">${nCreador.toUpperCase()}</span><br><br>_______________________</td>
            <td colspan="2" style="text-align:center; vertical-align:bottom; font-family: 'Segoe UI'; font-size: 9pt; font-weight: bold;">AUTORIZADO POR:<br><span style="color:#475569;">${nAutoriza.toUpperCase()}</span><br><br>_______________________</td>
            <td colspan="1" style="text-align:center; vertical-align:bottom; font-family: 'Segoe UI'; font-size: 9pt; font-weight: bold;">CONTABILIZADO POR:<br><span style="color:#475569;">${nContador.toUpperCase()}</span><br><br>_______________________</td>
            <td colspan="2" style="text-align:center; vertical-align:bottom; font-family: 'Segoe UI'; font-size: 9pt; font-weight: bold;">RECEPCIONADO POR:<br><span style="color:#475569;">${nRecepcion.toUpperCase()}</span><br><br>_______________________</td>
        </tr>
    </table>
    `;

    const template = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"></head><body>${html}</body></html>`;
    const blob = new Blob([template], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${nombreArchivoFinal}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

/**
 * =========================================================================
 * EXPORTACIÓN PDF VECTORIAL - REGLA ESTRICTA 40 REGISTROS Y TOTALES
 * =========================================================================
 */
export const exportarReporteAPDF = (reporte, lineas, firmantes = [], userRol = '') => {
    if (!reporte || !lineas || lineas.length === 0) return;

    const rolFormateado = (userRol || reporte.userRol || 'REPORTANTE').toUpperCase();
    const numeroPadded = reporte.id ? String(reporte.id).padStart(5, '0') : '00000';
    const codigoUnicoInterno = reporte.id ? `RV-${numeroPadded}` : 'S/N';
    const nombreArchivoFinal = `${rolFormateado} RV${numeroPadded}`;

    const repPeriodo = reporte.periodo_lbl || '--/--/--';
    const repFecha = reporte.fecha || formatearFechaResumida(reporte.fecha_envio || reporte.fecha_creacion);
    const repMarca = reporte.marca || '-';
    const repCargo = reporte.cargo_a_marca || 'No';
    const repCC = reporte.centro_costo_lbl || '-';

    let subtotalFloat = 0;
    lineas.forEach(lin => {
        const val = parseFloat(String(lin.monto).replace(/[^0-9.-]+/g, '')) || 0;
        subtotalFloat += val;
    });
    const extraFloat = subtotalFloat * 0.1725;
    const tgFloat = subtotalFloat + extraFloat;

    const nCreador = reporte.creador_nombre || firmantes.find(f => String(f.codigo) === String(reporte.codigo_usuario))?.nombre || '-';
    const nAutoriza = reporte.autorizador_nombre || '';
    const nContador = reporte.contador_nombre || '';
    const nRecepcion = reporte.recepcion_nombre || '';

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;

    const ROWS_PER_PAGE = 38;
    const totalPages = Math.ceil(lineas.length / ROWS_PER_PAGE) || 1;
    let paginasHTML = '';

    for (let i = 0; i < totalPages; i++) {
        const chunk = lineas.slice(i * ROWS_PER_PAGE, (i + 1) * ROWS_PER_PAGE);
        const isLastPage = (i === totalPages - 1);
        
        let pageSubtotal = 0;
        let tablaCuerpoHTML = '';
        
        chunk.forEach(lin => {
            const valM = parseFloat(String(lin.monto).replace(/[^0-9.-]+/g, '')) || 0;
            pageSubtotal += valM; // ✨ Calculamos el subtotal de la página actual
            tablaCuerpoHTML += `
                <tr>
                    <td style="text-align: center; font-weight: bold;">${lin.codigo_empleado}</td>
                    <td style="text-align: left; overflow: hidden; text-overflow: ellipsis;">${lin.empleado_nombre || lin.nombres_apellidos || 'No encontrado'}</td>
                    <td style="text-align: left; overflow: hidden; text-overflow: ellipsis; font-size: 8px; color: #475569;">${lin.empleado_puesto || lin.puesto || '-'}</td>
                    <td style="text-align: center; font-weight: bold;">${lin.codigo_variable || ''}</td>
                    <td style="text-align: left; overflow: hidden; text-overflow: ellipsis; font-size: 8px; color: #475569;">${lin.nombre_variable || ''}</td>
                    <td class="font-bold text-vino" style="text-align: right; padding-right: 12px;">$ ${formatoMoneda.format(valM)}</td>
                </tr>
            `;
        });

        // ✨ LÓGICA DINÁMICA DE TOTALES (SUB TOTALES POR PÁGINA Y GENERALES)
        let bloqueTotalesHTML = `<tr><td colspan="6" style="height: 6px; border:none; background:transparent;"></td></tr>`;

        // 1. Si hay múltiples páginas, cada una muestra su Subtotal de Página
        if (totalPages > 1) {
            bloqueTotalesHTML += `
                <tr>
                    <td colspan="3" style="border: none; background: transparent;"></td>
                    <td colspan="2" class="rt-label-inline" style="background: #64748b !important; color: #ffffff !important; font-weight: bold; text-align: center; border: 1px solid #64748b;">SUB TOTAL PÁGINA</td>
                    <td style="text-align: right; font-weight: bold; background: #ffffff; border: 1px solid #64748b; color: #64748b; padding-right: 12px;">$ ${formatoMoneda.format(pageSubtotal)}</td>
                </tr>
            `;
        }

        // 2. Si es la última página, dibujamos los totales finales
        if (isLastPage) {
            if (repCargo === 'Si') {
                const lblSubtotal = totalPages > 1 ? "SUB TOTAL GENERAL" : "SUB TOTAL";
                bloqueTotalesHTML += `
                    <tr>
                        <td colspan="3" style="border: none; background: transparent;"></td>
                        <td colspan="2" class="rt-label-inline" style="background: #cc0000 !important; color: #ffffff !important; font-weight: bold; text-align: center; border: 1px solid #cc0000;">${lblSubtotal}</td>
                        <td style="text-align: right; font-weight: bold; background: #ffffff; border: 1px solid #cc0000; color: #cc0000; padding-right: 12px;">$ ${formatoMoneda.format(subtotalFloat)}</td>
                    </tr>
                    <tr>
                        <td colspan="3" style="border: none; background: transparent;"></td>
                        <td colspan="2" class="rt-label-inline" style="background: #f59e0b !important; color: #ffffff !important; font-weight: bold; text-align: center; border: 1px solid #f59e0b;">MÁS CARGO A MARCA (17.25%)</td>
                        <td style="text-align: right; font-weight: bold; background: #ffffff; border: 1px solid #f59e0b; color: #f59e0b; padding-right: 12px;">$ ${formatoMoneda.format(extraFloat)}</td>
                    </tr>
                `;
            }

            bloqueTotalesHTML += `
                <tr>
                    <td colspan="3" style="border: none; background: transparent;"></td>
                    <td colspan="2" class="rt-label-inline" style="background: #800020 !important; color: #ffffff !important; font-weight: bold; text-align: center; border: 1px solid #800020;">TOTAL REPORTE</td>
                    <td style="text-align: right; font-weight: bold; background: #ffffff; border: 1px solid #800020; color: #800020; padding-right: 12px;">$ ${formatoMoneda.format(tgFloat)}</td>
                </tr>
            `;
        }

        paginasHTML += `
            <div class="hoja-impresion">
                <div style="position: relative; display: flex; align-items: center; justify-content: center; margin-bottom: 15px; min-height: 60px; width: 100%;">
                    
                    <div style="position: absolute; left: 0; top: 0; display: flex; align-items: center; gap: 4px;">
                        <img src="${logoCimsa}" style="height: 60px; width: auto; object-fit: contain;" />
                        <img src="${logoDietco}" style="height: 60px; width: auto; object-fit: contain;" />
                        <img src="${logoSq}" style="height: 54px; width: auto; object-fit: contain;" />
                    </div>
                    
                    <div class="reporte-titulo" style="margin: 0; text-align: center; width: 100%; padding-left: 240px; padding-right: 240px; box-sizing: border-box; font-size: 13.5px;">
                        REPORTE DE COMISIONES, PREMIOS Y BONIFICACIONES
                    </div>

                    <div style="position: absolute; right: 0; top: 18px; font-weight: 800; color: #cc0000; font-size: 12.5px; font-family: 'Segoe UI', Arial, sans-serif; white-space: nowrap;">
                        CÓDIGO: ${codigoUnicoInterno}
                    </div>
                </div>
                
                <div class="reporte-header-grid">
                    <div class="rh-group"><label>Periodo de Planilla:</label><div class="rh-value">${repPeriodo}</div></div>
                    <div class="rh-group"><label>Fecha:</label><div class="rh-value">${repFecha}</div></div>
                    <div class="rh-group"><label>Marca:</label><div class="rh-value">${repMarca}</div></div>
                    <div class="rh-group"><label>Cargo a Marca:</label><div class="rh-value">${repCargo}</div></div>
                    <div class="rh-group" style="grid-column: span 2;"><label>Centro de Costo:</label><div class="rh-value">${repCC}</div></div>
                </div>

                <div class="tabla-container">
                    <table class="tabla-principal">
                        <thead>
                            <tr>
                                <th style="width: 7%;">Código</th>
                                <th style="width: 28%;">Nombre Empleado</th>
                                <th style="width: 20%;">Puesto</th>
                                <th style="width: 7%;">Cód. Var</th>
                                <th style="width: 26%;">Nombre Variable</th>
                                <th style="width: 12%; background-color: #e2e8f0; color: #000000 !important;">Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tablaCuerpoHTML}
                            ${bloqueTotalesHTML}
                        </tbody>
                    </table>
                </div>

                <div class="footer-fijo">
                    <div class="seccion-firmas">
                        <div class="firma-box"><div class="firma-linea"><b>${nCreador.toUpperCase()}</b></div>ELABORADO POR</div>
                        <div class="firma-box"><div class="firma-linea"><b>${nAutoriza.toUpperCase()}</b></div>AUTORIZADO POR</div>
                        <div class="firma-box"><div class="firma-linea"><b>${nContador.toUpperCase()}</b></div>CONTABILIZADO POR</div>
                        <div class="firma-box"><div class="firma-linea"><b>${nRecepcion.toUpperCase()}</b></div>RECEPCIONADO POR</div>
                    </div>
                    
                    <div class="page-number">Página ${i + 1} de ${totalPages}</div>
                </div>
            </div>
        `;
    }

    // ✨ MAGIA CSS: Usamos "@page { margin: 0; }" para ELIMINAR los encabezados/URLs del navegador
    // Luego reconstruimos los márgenes por dentro usando padding: 10mm;
    doc.write(`
        <html>
            <head>
                <title>${nombreArchivoFinal}</title>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; color: #000; background: #fff; padding: 0; margin: 0; -webkit-print-color-adjust: exact; color-adjust: exact; }
                    
                    @page { size: letter; margin: 0; } 

                    .hoja-impresion { 
                        position: relative;
                        width: 100%;
                        height: 279.4mm; /* Medida Carta Completa */
                        padding: 10mm;   /* Margen interior seguro */
                        page-break-after: always;
                        box-sizing: border-box;
                        overflow: hidden;
                    }
                    .hoja-impresion:last-child {
                        page-break-after: auto; 
                    }
                    
                    .reporte-titulo { text-align: center; font-size: 16px; font-weight: 800; margin-bottom: 4px; text-transform: uppercase; color: #000; }
                    .reporte-codigo { text-align: center; font-size: 13px; font-weight: 800; color: #cc0000; margin-bottom: 20px; }
                    
                    .reporte-header-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 40px; margin-bottom: 12px; width: 100%; }
                    .rh-group { display: flex; align-items: center; justify-content: space-between; font-size: 11px; }
                    .rh-group label { font-weight: 800; color: #cc0000; text-transform: uppercase; white-space: nowrap; }
                    .rh-value { flex-grow: 1; text-align: center; font-weight: 600; border-bottom: 1px solid #cbd5e1; padding: 2px; margin-left: 10px; color: #000; }
                    
                    table.tabla-principal { width: 100%; border-collapse: collapse; table-layout: fixed; margin-top: 5px; }
                    table.tabla-principal th { background-color: #cc0000 !important; color: #ffffff !important; padding: 3px 4px !important; border: 1px solid #000000; text-transform: uppercase; font-weight: bold; font-size: 8.5px; }
                    table.tabla-principal td { padding: 3px 4px; border: 1px solid #cbd5e1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 8.5px; color: #000000; height: 14px; }
                    .text-vino { color: #cc0000 !important; }
                    .font-bold { font-weight: bold; }
                    .rt-label-inline { padding: 3px 6px; font-size: 8.5px; }

                    .footer-fijo {
                        position: absolute;
                        bottom: 10mm; /* Respeta el padding interior */
                        left: 10mm;
                        width: calc(100% - 20mm);
                    }

                    .seccion-firmas { display: flex; justify-content: space-between; align-items: flex-end; text-align: center; font-size: 9px; font-weight: bold; width: 100%; gap: 15px; }
                    .firma-box { width: 23%; display: flex; flex-direction: column; align-items: center; }
                    .firma-linea { border-bottom: 1px solid #000000; width: 100%; height: 30px; margin-bottom: 6px; font-size: 11px; display: flex; align-items: flex-end; justify-content: center; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; color: #334155; }
                    
                    .page-number { text-align: center; font-size: 9px; color: #64748b; margin-top: 15px; }
                    
                    @media print { body { background: #ffffff; } }
                </style>
            </head>
            <body>
                ${paginasHTML}
            </body>
        </html>
    `);

    doc.close();

    const tituloOriginalPestaña = window.parent.document.title;
    
    setTimeout(() => {
        window.parent.document.title = nombreArchivoFinal;
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        window.parent.document.title = tituloOriginalPestaña;
        document.body.removeChild(iframe);
    }, 350);
};