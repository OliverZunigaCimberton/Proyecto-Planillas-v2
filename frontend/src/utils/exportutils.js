// src/utils/exportutils.js
import logoCimsa from "../styles/logos/cimsa.png";
import logoDietco from "../styles/logos/dietco.png";
import logoSq from "../styles/logos/sq.png";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import html2pdf from 'html2pdf.js';

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
export const exportarReporteAExcel = async (reporte, lineas, firmantes = [], userRol = '') => {
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

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Reporte Variables');

    // 1. Configuración de anchos de columna (Mimetizando los pixeles originales)
    sheet.columns = [
        { width: 11 }, // A: CÓDIGO
        { width: 38 }, // B: NOMBRE EMPLEADO
        { width: 28 }, // C: PUESTO
        { width: 11 }, // D: CÓD. VAR
        { width: 35 }, // E: NOMBRE VARIABLE
        { width: 17 }  // F: MONTO
    ];

    const thinBorder = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' }
    };

    // 2. Encabezados Estáticos
    sheet.mergeCells('A1:F1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'REPORTE DE COMISIONES, PREMIOS Y BONIFICACIONES';
    titleCell.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FF000000' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    sheet.mergeCells('A2:F2');
    const codeCell = sheet.getCell('A2');
    codeCell.value = `CÓDIGO: ${codigoUnicoInterno}`;
    codeCell.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FFCC0000' } };
    codeCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Fila 4: Periodo y Fecha
    sheet.mergeCells('A4:B4');
    sheet.getCell('A4').value = 'PERIODO DE PLANILLA:';
    sheet.getCell('A4').font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFCC0000' } };
    sheet.mergeCells('C4:D4');
    sheet.getCell('C4').value = repPeriodo;
    sheet.getCell('C4').font = { name: 'Segoe UI', size: 10 };
    sheet.getCell('C4').alignment = { horizontal: 'center' };
    sheet.getCell('C4').border = { bottom: { style: 'thin' } };
    sheet.getCell('D4').border = { bottom: { style: 'thin' } }; 
    sheet.getCell('E4').value = 'FECHA:';
    sheet.getCell('E4').font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFCC0000' } };
    sheet.getCell('E4').alignment = { horizontal: 'right' };
    sheet.getCell('F4').value = repFecha;
    sheet.getCell('F4').font = { name: 'Segoe UI', size: 10 };
    sheet.getCell('F4').alignment = { horizontal: 'center' };
    sheet.getCell('F4').border = { bottom: { style: 'thin' } };

    // Fila 5: Marca y Cargo a Marca
    sheet.mergeCells('A5:B5');
    sheet.getCell('A5').value = 'MARCA:';
    sheet.getCell('A5').font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFCC0000' } };
    sheet.mergeCells('C5:D5');
    sheet.getCell('C5').value = repMarca;
    sheet.getCell('C5').font = { name: 'Segoe UI', size: 10 };
    sheet.getCell('C5').alignment = { horizontal: 'center' };
    sheet.getCell('C5').border = { bottom: { style: 'thin' } };
    sheet.getCell('D5').border = { bottom: { style: 'thin' } };
    sheet.getCell('E5').value = 'CARGO A MARCA:';
    sheet.getCell('E5').font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFCC0000' } };
    sheet.getCell('E5').alignment = { horizontal: 'right' };
    sheet.getCell('F5').value = repCargo;
    sheet.getCell('F5').font = { name: 'Segoe UI', size: 10 };
    sheet.getCell('F5').alignment = { horizontal: 'center' };
    sheet.getCell('F5').border = { bottom: { style: 'thin' } };

    // Fila 6: Centro de Costo
    sheet.mergeCells('A6:B6');
    sheet.getCell('A6').value = 'CENTRO DE COSTO:';
    sheet.getCell('A6').font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFCC0000' } };
    sheet.mergeCells('C6:F6');
    sheet.getCell('C6').value = repCC;
    sheet.getCell('C6').font = { name: 'Segoe UI', size: 10 };
    sheet.getCell('C6').border = { bottom: { style: 'thin' } };
    sheet.getCell('D6').border = { bottom: { style: 'thin' } };
    sheet.getCell('E6').border = { bottom: { style: 'thin' } };
    sheet.getCell('F6').border = { bottom: { style: 'thin' } };

    // 3. Títulos de Tabla (Fila 8)
    const headers = ['CÓDIGO', 'NOMBRE EMPLEADO', 'PUESTO', 'CÓD. VAR', 'NOMBRE VARIABLE', 'MONTO'];
    const headerRow = sheet.getRow(8);
    headerRow.values = headers;
    headerRow.eachCell((cell, colNumber) => {
        cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: colNumber === 6 ? 'FF000000' : 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colNumber === 6 ? 'FFCBD5E1' : 'FFCC0000' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = thinBorder;
    });

    // 4. Inyección de Datos (Iteración de líneas)
    let currentRowIndex = 9;
    lineas.forEach(lin => {
        const row = sheet.getRow(currentRowIndex);
        const valM = parseFloat(String(lin.monto).replace(/[^0-9.-]+/g, '')) || 0;
        
        row.values = [
            lin.codigo_empleado,
            lin.empleado_nombre || lin.nombres_apellidos || 'No encontrado',
            lin.empleado_puesto || lin.puesto || '-',
            lin.codigo_variable || '',
            lin.nombre_variable || '',
            valM
        ];

        // Formateo visual de celdas iteradas
        [1, 4].forEach(col => { row.getCell(col).alignment = { horizontal: 'center' }; row.getCell(col).border = thinBorder; });
        [2, 3, 5].forEach(col => { row.getCell(col).alignment = { horizontal: 'left' }; row.getCell(col).border = thinBorder; });
        
        const cellMonto = row.getCell(6);
        cellMonto.alignment = { horizontal: 'right' };
        cellMonto.border = thinBorder;
        cellMonto.font = { bold: true, color: { argb: 'FFCC0000' } };
        cellMonto.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
        cellMonto.numFmt = '"$"#,##0.00';

        currentRowIndex++;
    });

    currentRowIndex++; // Salto de línea

    // 5. Motor de Totales Dinámicos
    const renderizarFilaTotal = (rowIdx, label, value, bgArgb) => {
        sheet.mergeCells(`D${rowIdx}:E${rowIdx}`);
        const lblCell = sheet.getCell(`D${rowIdx}`);
        lblCell.value = label;
        lblCell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 8.5 };
        lblCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
        lblCell.alignment = { horizontal: 'center', vertical: 'middle' };
        lblCell.border = thinBorder;
        sheet.getCell(`E${rowIdx}`).border = thinBorder;

        const valCell = sheet.getCell(`F${rowIdx}`);
        valCell.value = value;
        valCell.font = { bold: true, color: { argb: bgArgb }, size: 8.5 };
        valCell.alignment = { horizontal: 'right', vertical: 'middle' };
        valCell.numFmt = '"$"#,##0.00';
        valCell.border = { top: { style: 'thin', color: { argb: bgArgb } }, bottom: { style: 'thin', color: { argb: bgArgb } }, left: { style: 'thin', color: { argb: bgArgb } }, right: { style: 'thin', color: { argb: bgArgb } } };
    };

    if (repCargo === 'Si') {
        renderizarFilaTotal(currentRowIndex++, 'SUB TOTAL', subtotalFloat, 'FFCC0000');
        renderizarFilaTotal(currentRowIndex++, 'MÁS CARGO A MARCA (17.25%)', extraFloat, 'FFF59E0B');
        renderizarFilaTotal(currentRowIndex++, 'TOTAL REPORTE', tgFloat, 'FF800020');
    } else {
        renderizarFilaTotal(currentRowIndex++, 'TOTAL REPORTE', subtotalFloat, 'FFCC0000');
    }

    currentRowIndex += 3; // Salto hacia las firmas

    // 6. Bloque de Firmas
    const sigRow1 = sheet.getRow(currentRowIndex);
    const sigRow2 = sheet.getRow(currentRowIndex + 1);
    const sigRow3 = sheet.getRow(currentRowIndex + 2);
    
    sigRow1.getCell(1).value = 'ELABORADO POR:';
    sigRow2.getCell(1).value = nCreador;
    sigRow3.getCell(1).value = '_______________________';

    sheet.mergeCells(`B${currentRowIndex}:C${currentRowIndex}`);
    sheet.mergeCells(`B${currentRowIndex+1}:C${currentRowIndex+1}`);
    sheet.mergeCells(`B${currentRowIndex+2}:C${currentRowIndex+2}`);
    sigRow1.getCell(2).value = 'AUTORIZADO POR:';
    sigRow2.getCell(2).value = nAutoriza;
    sigRow3.getCell(2).value = '_______________________';

    sigRow1.getCell(4).value = 'CONTABILIZADO POR:';
    sigRow2.getCell(4).value = nContador;
    sigRow3.getCell(4).value = '_______________________';

    sheet.mergeCells(`E${currentRowIndex}:F${currentRowIndex}`);
    sheet.mergeCells(`E${currentRowIndex+1}:F${currentRowIndex+1}`);
    sheet.mergeCells(`E${currentRowIndex+2}:F${currentRowIndex+2}`);
    sigRow1.getCell(5).value = 'RECEPCIONADO POR:';
    sigRow2.getCell(5).value = nRecepcion;
    sigRow3.getCell(5).value = '_______________________';

    [currentRowIndex, currentRowIndex+1, currentRowIndex+2].forEach(rIdx => {
        [1, 2, 4, 5].forEach(cIdx => {
            const cell = sheet.getCell(rIdx, cIdx);
            cell.alignment = { horizontal: 'center', vertical: 'bottom' };
            if (rIdx === currentRowIndex) cell.font = { bold: true, size: 9 };
            if (rIdx === currentRowIndex + 1) cell.font = { bold: true, color: { argb: 'FF475569' }, size: 9 };
        });
    });

    // 7. Renderizado Final e invocación de Descarga Nativa (.xlsx)
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${nombreArchivoFinal}.xlsx`);
};

/**
 * =========================================================================
 * EXPORTACIÓN PDF VECTORIAL - REGLA ESTRICTA 40 REGISTROS Y TOTALES
 * =========================================================================
 */
export const exportarReporteAPDF = async (reporte, lineas, firmantes = [], userRol = '') => {
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

    // ✨ MAGIA CSS Y HTML: Lo envolvemos en un contenedor para html2pdf
    const htmlContent = `
        <div id="pdf-wrapper">
            <style>
                #pdf-wrapper { font-family: 'Segoe UI', Arial, sans-serif; color: #000; background: #fff; padding: 0; margin: 0; }
                
                .hoja-impresion { 
                    position: relative;
                    width: 100%; 
                    height: 278mm; 
                    padding: 10mm;   
                    page-break-after: always;
                    box-sizing: border-box;
                    overflow: hidden;
                    background: white;
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
            </style>
            ${paginasHTML}
        </div>
    `;

    // Crear un contenedor temporal en el DOM (invisible)
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    tempDiv.innerHTML = htmlContent;
    document.body.appendChild(tempDiv);

    // Opciones de configuración para html2pdf
    const opt = {
        margin:       0, 
        filename:     `${nombreArchivoFinal}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'letter', orientation: 'portrait' }
    };

    // Procesar y descargar automáticamente
    await html2pdf().set(opt).from(tempDiv.firstElementChild).save();

    // Limpiar el DOM
    document.body.removeChild(tempDiv);
};