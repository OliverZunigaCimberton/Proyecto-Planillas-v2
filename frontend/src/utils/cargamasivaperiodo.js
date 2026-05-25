// src/utils/excelHelper.js
import * as XLSX from 'xlsx';

export const procesarArchivoExcel = (archivo) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
                
                const registrosRaw = jsonData.map(row => ({
                    codigo_empleado: row.codigo_empleado || row.id || row.CODIGO,
                    nombres_apellidos: row.nombres_apellidos || row.nombre || row.NOMBRE,
                    puesto: row.puesto || row.cargo || row.PUESTO,
                    empresa: row.empresa || 'GRUPO IMBERTON'
                }));
                
                const mapUnicos = new Map();
                registrosRaw.forEach(emp => {
                    if (emp.codigo_empleado) mapUnicos.set(parseInt(emp.codigo_empleado, 10), emp);
                });
                resolve(Array.from(mapUnicos.values()));
            } catch (err) { reject(err); }
        };
        reader.readAsArrayBuffer(archivo);
    });
};