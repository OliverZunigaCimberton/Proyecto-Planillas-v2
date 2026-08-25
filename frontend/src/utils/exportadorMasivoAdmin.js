// src/utils/exportadorMasivoAdmin.js
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// Constantes de diseño corporativo
const formatoMoneda = '"$"#,##0.00';
const colorRojo = 'FFCC0000';
const colorGrisCabecera = 'FFCBD5E1';
const colorGrisMonto = 'FFE2E8F0';
const thinBorder = {
    top: { style: 'thin' }, left: { style: 'thin' },
    bottom: { style: 'thin' }, right: { style: 'thin' }
};

const formatearFechaResumida = (fechaStr) => {
    if (!fechaStr) return "--/--/--";
    const fechaLimpia = fechaStr.split('T')[0];
    const [year, month, day] = fechaLimpia.split('-');
    return `${day}/${month}/${year.slice(-2)}`;
};

export const generarExcelMasivo = async (reportes, periodoTexto) => {
    if (!reportes || reportes.length === 0) {
        alert("No hay datos válidos en este periodo para exportar.");
        return;
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema de Planillas - Cimberton';
    
    // 1. Pestañas Globales (Consolidados Planos)
    const wsConsolidado = workbook.addWorksheet('Consolidado');
    const wsComisiones = workbook.addWorksheet('Consolidado Comisiones');
    const wsPremios = workbook.addWorksheet('Consolidado Premios');
    const wsBonos = workbook.addWorksheet('Consolidado Bonificaciones');
    const wsCuadre = workbook.addWorksheet('Cuadre');

    const columnasMaestras = [
        { header: 'MARCA', key: 'marca', width: 25 },
        { header: 'CÓDIGO', key: 'codigo', width: 11 },
        { header: 'NOMBRE EMPLEADO', key: 'nombre', width: 38 },
        { header: 'PUESTO', key: 'puesto', width: 28 },
        { header: 'CÓD. VAR', key: 'codVar', width: 11 },
        { header: 'NOMBRE VARIABLE', key: 'nomVar', width: 35 },
        { header: 'MONTO', key: 'monto', width: 16 },
        { header: 'ELABORADO POR', key: 'elab', width: 22 },
        { header: 'AUTORIZADO POR', key: 'auth', width: 22 },
        { header: 'CONTABILIZADO POR', key: 'cont', width: 22 },
        { header: 'RECEPCIONADO POR', key: 'recep', width: 22 },
        { header: 'CORREOS DE RESPALDO', key: 'respaldos', width: 25 } // Ajustado ancho para el link
    ];

    [wsConsolidado, wsComisiones, wsPremios, wsBonos].forEach(ws => {
        ws.columns = columnasMaestras;
        ws.getRow(1).eachCell((cell, colNumber) => {
            cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: colNumber === 7 ? 'FF000000' : 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colNumber === 7 ? colorGrisCabecera : colorRojo } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = thinBorder;
        });
        ws.views = [{ state: 'frozen', ySplit: 1 }];
    });

    const resumenCuadre = {};

    // 2. Pestañas Individuales de Marca (Molde Fotográfico Exacto)
    reportes.forEach((rep) => {
        let nombreHojaMarca = (rep.marca || 'S-N').replace(/[\\/*?:[\]]/g, '').substring(0, 30);
        let counter = 1;
        let originalName = nombreHojaMarca;
        while(workbook.getWorksheet(nombreHojaMarca)) {
            nombreHojaMarca = `${originalName.substring(0, 27)}(${counter})`;
            counter++;
        }

        const wsMarca = workbook.addWorksheet(nombreHojaMarca);
        
        wsMarca.columns = [
            { width: 11 }, { width: 38 }, { width: 28 }, { width: 11 }, { width: 35 }, { width: 17 }
        ];

        const numeroPadded = rep.id ? String(rep.id).padStart(5, '0') : '00000';
        const repFecha = formatearFechaResumida(rep.fecha_envio || rep.fecha_creacion);
        
        const tieneCargoMarcaLinea = rep.lineas?.some(l => l.cargo_a_marca === 'Si' || l.cargo_a_marca === true);
        const repCargo = (rep.cargo_a_marca === 'Si' || rep.cargo_a_marca === true || tieneCargoMarcaLinea) ? 'Si' : 'No';
        const repCC = rep.centro_costo_lbl || rep.centro_costo || 'N/A - Centro de Costo no encontrado';

        // ✨ NUEVO: Extracción de URLs súper blindada
        let respaldosUrls = '';
        if (rep.adjuntos) {
            try {
                const adjuntosArray = typeof rep.adjuntos === 'string' ? JSON.parse(rep.adjuntos) : rep.adjuntos;
                if (Array.isArray(adjuntosArray) && adjuntosArray.length > 0) {
                    // Extraemos solo las URLs válidas y las separamos por coma para evitar que el \n rompa Excel
                    const linksValidos = adjuntosArray.map(adj => adj.url).filter(Boolean);
                    if (linksValidos.length > 0) {
                        respaldosUrls = linksValidos.join(', ');
                    }
                }
            } catch (e) {
                console.error("Error parseando adjuntos en Excel:", e);
            }
        }

        // Título Principal
        wsMarca.mergeCells('A1:F1');
        const titleCell = wsMarca.getCell('A1');
        titleCell.value = 'REPORTE DE COMISIONES, PREMIOS Y BONIFICACIONES';
        titleCell.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FF000000' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

        // Código
        wsMarca.mergeCells('A2:F2');
        const codeCell = wsMarca.getCell('A2');
        codeCell.value = `CÓDIGO: RV-${numeroPadded}`;
        codeCell.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: colorRojo } };
        codeCell.alignment = { horizontal: 'center', vertical: 'middle' };

        // Fila 4: Periodo y Fecha
        wsMarca.mergeCells('A4:B4'); wsMarca.getCell('A4').value = 'PERIODO DE PLANILLA:'; wsMarca.getCell('A4').font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: colorRojo } };
        wsMarca.mergeCells('C4:D4'); wsMarca.getCell('C4').value = periodoTexto; wsMarca.getCell('C4').alignment = { horizontal: 'center' }; wsMarca.getCell('C4').border = { bottom: { style: 'thin' } }; wsMarca.getCell('D4').border = { bottom: { style: 'thin' } };
        wsMarca.getCell('E4').value = 'FECHA:'; wsMarca.getCell('E4').font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: colorRojo } }; wsMarca.getCell('E4').alignment = { horizontal: 'right' };
        wsMarca.getCell('F4').value = repFecha; wsMarca.getCell('F4').alignment = { horizontal: 'center' }; wsMarca.getCell('F4').border = { bottom: { style: 'thin' } };

        // Fila 5: Marca y Cargo a Marca
        wsMarca.mergeCells('A5:B5'); wsMarca.getCell('A5').value = 'MARCA:'; wsMarca.getCell('A5').font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: colorRojo } };
        wsMarca.mergeCells('C5:D5'); wsMarca.getCell('C5').value = rep.marca; wsMarca.getCell('C5').alignment = { horizontal: 'center' }; wsMarca.getCell('C5').border = { bottom: { style: 'thin' } }; wsMarca.getCell('D5').border = { bottom: { style: 'thin' } };
        wsMarca.getCell('E5').value = 'CARGO A MARCA:'; wsMarca.getCell('E5').font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: colorRojo } }; wsMarca.getCell('E5').alignment = { horizontal: 'right' };
        wsMarca.getCell('F5').value = repCargo; wsMarca.getCell('F5').alignment = { horizontal: 'center' }; wsMarca.getCell('F5').border = { bottom: { style: 'thin' } };

        // Fila 6: Centro de Costo
        wsMarca.mergeCells('A6:B6'); wsMarca.getCell('A6').value = 'CENTRO DE COSTO:'; wsMarca.getCell('A6').font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: colorRojo } };
        wsMarca.mergeCells('C6:F6'); wsMarca.getCell('C6').value = repCC; wsMarca.getCell('C6').font = { name: 'Segoe UI', size: 10 };
        ['C6', 'D6', 'E6', 'F6'].forEach(cellRef => { wsMarca.getCell(cellRef).border = { bottom: { style: 'thin' } }; });

        // Fila 8: Títulos de Tabla
        const headerRow = wsMarca.getRow(8);
        headerRow.values = ['CÓDIGO', 'NOMBRE EMPLEADO', 'PUESTO', 'CÓD. VAR', 'NOMBRE VARIABLE', 'MONTO'];
        headerRow.eachCell((cell, colNumber) => {
            cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: colNumber === 6 ? 'FF000000' : 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colNumber === 6 ? colorGrisCabecera : colorRojo } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = thinBorder;
        });

        if (!resumenCuadre[rep.marca]) {
            resumenCuadre[rep.marca] = { comisiones: 0, premios: 0, bonos: 0, sheetName: nombreHojaMarca };
        }

        let currentRowIndex = 9;
        let subtotalMarca = 0;

        rep.lineas.forEach(lin => {
            const monto = parseFloat(String(lin.monto).replace(/[^0-9.-]+/g, '')) || 0;
            subtotalMarca += monto;
            const nomVarUpper = (lin.nombre_variable || '').toUpperCase();
            
            let esComision = nomVarUpper.includes('COMISI');
            let esPremio = nomVarUpper.includes('PREMIO');
            let esBono = nomVarUpper.includes('BONO') || nomVarUpper.includes('BONIF');

            // Insertamos la URL recolectada
            const rowData = {
                marca: rep.marca, codigo: lin.codigo_empleado, nombre: lin.empleado_nombre, puesto: lin.empleado_puesto,
                codVar: lin.codigo_variable, nomVar: lin.nombre_variable, monto: monto,
                elab: rep.creador_nombre, auth: rep.autorizador_nombre, cont: rep.contador_nombre, recep: rep.recepcion_nombre,
                respaldos: respaldosUrls
            };

            const rowMarca = wsMarca.getRow(currentRowIndex);
            rowMarca.values = [ lin.codigo_empleado, lin.empleado_nombre || 'No encontrado', lin.empleado_puesto || '-', lin.codigo_variable || '', lin.nombre_variable || '', monto ];
            
            [1, 4].forEach(col => { rowMarca.getCell(col).alignment = { horizontal: 'center' }; rowMarca.getCell(col).border = thinBorder; });
            [2, 3, 5].forEach(col => { rowMarca.getCell(col).alignment = { horizontal: 'left' }; rowMarca.getCell(col).border = thinBorder; });
            
            const cellMonto = rowMarca.getCell(6);
            cellMonto.alignment = { horizontal: 'right' }; cellMonto.border = thinBorder; cellMonto.font = { bold: true, color: { argb: colorRojo } };
            cellMonto.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorGrisMonto } }; cellMonto.numFmt = formatoMoneda;

            const rowCons = wsConsolidado.addRow(rowData);
            formatearFilaConsolidada(rowCons);

            rowCons.getCell('codigo').value = { text: String(lin.codigo_empleado), hyperlink: `#'${nombreHojaMarca}'!A${currentRowIndex}`, tooltip: `Ir a ${nombreHojaMarca}` };
            rowCons.getCell('codigo').font = { color: { argb: 'FF0000FF' }, underline: true };
            rowMarca.getCell(1).value = { text: String(lin.codigo_empleado), hyperlink: `#'Consolidado'!A${rowCons.number}`, tooltip: 'Volver al Consolidado' };
            rowMarca.getCell(1).font = { color: { argb: 'FF0000FF' }, underline: true };

            if (esComision) { const r = wsComisiones.addRow(rowData); formatearFilaConsolidada(r); r.getCell('codigo').value = { text: String(lin.codigo_empleado), hyperlink: `#'${nombreHojaMarca}'!A${currentRowIndex}` }; r.getCell('codigo').font = { color: { argb: 'FF0000FF' }, underline: true }; resumenCuadre[rep.marca].comisiones += monto; }
            else if (esPremio) { const r = wsPremios.addRow(rowData); formatearFilaConsolidada(r); r.getCell('codigo').value = { text: String(lin.codigo_empleado), hyperlink: `#'${nombreHojaMarca}'!A${currentRowIndex}` }; r.getCell('codigo').font = { color: { argb: 'FF0000FF' }, underline: true }; resumenCuadre[rep.marca].premios += monto; }
            else if (esBono) { const r = wsBonos.addRow(rowData); formatearFilaConsolidada(r); r.getCell('codigo').value = { text: String(lin.codigo_empleado), hyperlink: `#'${nombreHojaMarca}'!A${currentRowIndex}` }; r.getCell('codigo').font = { color: { argb: 'FF0000FF' }, underline: true }; resumenCuadre[rep.marca].bonos += monto; }

            currentRowIndex++;
        });

        currentRowIndex++; 

        const renderTotal = (rIdx, lbl, val, color) => {
            wsMarca.mergeCells(`D${rIdx}:E${rIdx}`);
            const lblCell = wsMarca.getCell(`D${rIdx}`); lblCell.value = lbl; lblCell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 8.5 }; lblCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } }; lblCell.alignment = { horizontal: 'center', vertical: 'middle' }; lblCell.border = thinBorder; wsMarca.getCell(`E${rIdx}`).border = thinBorder;
            const valCell = wsMarca.getCell(`F${rIdx}`); valCell.value = val; valCell.font = { bold: true, color: { argb: color }, size: 8.5 }; valCell.alignment = { horizontal: 'right', vertical: 'middle' }; valCell.numFmt = formatoMoneda; valCell.border = { top: {style:'thin', color:{argb:color}}, bottom: {style:'thin', color:{argb:color}}, left: {style:'thin', color:{argb:color}}, right: {style:'thin', color:{argb:color}} };
        };

        const extraFloat = subtotalMarca * 0.1725;
        const tgFloat = subtotalMarca + extraFloat;

        if (repCargo === 'Si') {
            renderTotal(currentRowIndex++, 'SUB TOTAL', subtotalMarca, colorRojo);
            renderTotal(currentRowIndex++, 'MÁS CARGO A MARCA (17.25%)', extraFloat, 'FFF59E0B');
            renderTotal(currentRowIndex++, 'TOTAL REPORTE', tgFloat, 'FF800020');
        } else {
            renderTotal(currentRowIndex++, 'TOTAL REPORTE', subtotalMarca, colorRojo);
        }

        currentRowIndex += 3; 

        // Bloque de Firmas
        const sigR1 = wsMarca.getRow(currentRowIndex); const sigR2 = wsMarca.getRow(currentRowIndex + 1); const sigR3 = wsMarca.getRow(currentRowIndex + 2);
        
        sigR1.getCell(1).value = 'ELABORADO POR:'; sigR2.getCell(1).value = rep.creador_nombre; sigR3.getCell(1).value = '_______________________';
        wsMarca.mergeCells(`B${currentRowIndex}:C${currentRowIndex}`); wsMarca.mergeCells(`B${currentRowIndex+1}:C${currentRowIndex+1}`); wsMarca.mergeCells(`B${currentRowIndex+2}:C${currentRowIndex+2}`);
        sigR1.getCell(2).value = 'AUTORIZADO POR:'; sigR2.getCell(2).value = rep.autorizador_nombre; sigR3.getCell(2).value = '_______________________';
        sigR1.getCell(4).value = 'CONTABILIZADO POR:'; sigR2.getCell(4).value = rep.contador_nombre; sigR3.getCell(4).value = '_______________________';
        wsMarca.mergeCells(`E${currentRowIndex}:F${currentRowIndex}`); wsMarca.mergeCells(`E${currentRowIndex+1}:F${currentRowIndex+1}`); wsMarca.mergeCells(`E${currentRowIndex+2}:F${currentRowIndex+2}`);
        sigR1.getCell(5).value = 'RECEPCIONADO POR:'; sigR2.getCell(5).value = rep.recepcion_nombre; sigR3.getCell(5).value = '_______________________';

        [currentRowIndex, currentRowIndex+1, currentRowIndex+2].forEach(rIdx => {
            [1, 2, 4, 5].forEach(cIdx => {
                const c = wsMarca.getCell(rIdx, cIdx); c.alignment = { horizontal: 'center', vertical: 'bottom' };
                if (rIdx === currentRowIndex) c.font = { bold: true, size: 9 };
                if (rIdx === currentRowIndex + 1) c.font = { bold: true, color: { argb: 'FF475569' }, size: 9 };
            });
        });
    });

    // 3. Pestaña de Cuadre
    wsCuadre.columns = [
        { width: 35 }, { width: 18 }, { width: 5 }, 
        { width: 35 }, { width: 18 }, { width: 5 }, 
        { width: 35 }, { width: 18 }                
    ];

    wsCuadre.mergeCells('A1:B1'); wsCuadre.getCell('A1').value = 'COMISIONES';
    wsCuadre.mergeCells('D1:E1'); wsCuadre.getCell('D1').value = 'PREMIOS';
    wsCuadre.mergeCells('G1:H1'); wsCuadre.getCell('G1').value = 'BONOS';

    ['A1', 'D1', 'G1'].forEach(ref => {
        const cell = wsCuadre.getCell(ref);
        cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorRojo } }; cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    let filaComis = 2, filaPrem = 2, filaBono = 2;

    Object.keys(resumenCuadre).forEach(marca => {
        const data = resumenCuadre[marca];
        if (data.comisiones > 0) {
            const cellM = wsCuadre.getCell(`A${filaComis}`); cellM.value = { text: marca.toUpperCase(), hyperlink: `#'${data.sheetName}'!A1` }; cellM.font = { color: { argb: 'FF0000FF' }, underline: true, bold: true };
            const cellV = wsCuadre.getCell(`B${filaComis}`); cellV.value = data.comisiones; cellV.numFmt = formatoMoneda; cellV.font = { bold: true }; filaComis++;
        }
        if (data.premios > 0) {
            const cellM = wsCuadre.getCell(`D${filaPrem}`); cellM.value = { text: marca.toUpperCase(), hyperlink: `#'${data.sheetName}'!A1` }; cellM.font = { color: { argb: 'FF0000FF' }, underline: true, bold: true };
            const cellV = wsCuadre.getCell(`E${filaPrem}`); cellV.value = data.premios; cellV.numFmt = formatoMoneda; cellV.font = { bold: true }; filaPrem++;
        }
        if (data.bonos > 0) {
            const cellM = wsCuadre.getCell(`G${filaBono}`); cellM.value = { text: marca.toUpperCase(), hyperlink: `#'${data.sheetName}'!A1` }; cellM.font = { color: { argb: 'FF0000FF' }, underline: true, bold: true };
            const cellV = wsCuadre.getCell(`H${filaBono}`); cellV.value = data.bonos; cellV.numFmt = formatoMoneda; cellV.font = { bold: true }; filaBono++;
        }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const nombreClean = (periodoTexto || 'Periodo').replace(/[^a-zA-Z0-9]/g, '_');
    saveAs(blob, `Consolidado_Variables_${nombreClean}.xlsx`);
};

// ✨ NUEVO: Formato a prueba de fallos para la columna de respaldos (índice 12)
function formatearFilaConsolidada(row) {
    row.eachCell((cell, colNumber) => {
        cell.border = thinBorder; 
        cell.font = { name: 'Segoe UI', size: 9 };
        
        if (colNumber === 7) { 
            cell.numFmt = formatoMoneda; 
            cell.font = { bold: true, color: { argb: colorRojo } }; 
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorGrisMonto } }; 
            cell.alignment = { horizontal: 'right' };
            
        } else if (colNumber === 12) { // 👈 COLUMNA CORREOS DE RESPALDO
            cell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };
            
            const valorActual = cell.value ? String(cell.value) : '';
            
            // Si el valor contiene un http, es un enlace real. Creamos el Hyperlink nativo.
            if (valorActual.includes('http')) {
                const primeraUrl = valorActual.split(',')[0].trim();
                cell.value = {
                    text: 'Ver Respaldo Adjunto',
                    hyperlink: primeraUrl,
                    tooltip: 'Haz clic para descargar o ver el archivo adjunto'
                };
                cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF0000FF' }, underline: true };
            } 
            // Si no tiene nada, forzamos la frase "Sin respaldos" para evitar celdas en blanco.
            else {
                cell.value = 'Sin respaldos';
                cell.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: 'FF94A3B8' } };
            }
            
        } else {
            cell.alignment = { horizontal: colNumber === 2 || colNumber === 5 ? 'center' : 'left' }; 
        }
    });
}