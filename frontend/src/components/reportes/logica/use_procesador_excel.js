// src/components/reportes/modal_maestro/logica/use_procesador_excel.js
import * as XLSX from 'xlsx';
import { api } from '../../../services/api'; 

export const useProcesadorExcel = () => {

    const descargarPlantilla = () => {
        const ws = XLSX.utils.aoa_to_sheet([["codigo_empleado", "codigo_variable", "monto"]]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Plantilla SGP");
        XLSX.writeFile(wb, "Plantilla_Variables.xlsx");
    };

    const procesarCargaMasiva = async (excelFile, catalogos, idPeriodoConsulta, formatoMoneda) => {
        // Retornamos una Promesa para que el componente visual sepa cuándo terminó el proceso
        return new Promise((resolve) => {
            const reader = new FileReader();
            
            reader.onload = async (evt) => {
                try {
                    const data = new Uint8Array(evt.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const aoa = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });

                    const codigosExtraidos = [];
                    const registrosExcel = [];

                    for (let i = 1; i < aoa.length; i++) {
                        if (!aoa[i] || !aoa[i].length) continue;
                        
                        let cEmp = String(aoa[i][0] || '').trim();
                        let cVar = String(aoa[i][1] || '').trim();
                        let montoStr = String(aoa[i][2] || '').replace(/[^0-9.-]+/g, '');
                        let monto = parseFloat(montoStr);

                        if (cEmp && cVar && !isNaN(monto)) {
                            codigosExtraidos.push(cEmp);
                            registrosExcel.push({ cEmp, cVar, monto });
                        }
                    }

                    if (registrosExcel.length === 0) {
                        return resolve({ success: false, error: "Archivo vacío o sin montos válidos. Use la plantilla." });
                    }

                    // Consultar empleados a la base de datos
                    const response = await api.reportante.verificarEmpleados(codigosExtraidos, idPeriodoConsulta);
                    const empsDB = response.data || [];

                    const empleadosInvalidos = new Set();
                    const variablesInvalidas = new Set();

                    // Validación Estricta: Todo o Nada
                    registrosExcel.forEach(item => {
                        const emp = empsDB.find(e => String(e.codigo_empleado) === item.cEmp);
                        const v = catalogos.variables.find(varItem => String(varItem.codigo_variable).toUpperCase() === item.cVar.toUpperCase());

                        if (!emp) empleadosInvalidos.add(item.cEmp);
                        if (!v) variablesInvalidas.add(item.cVar);
                    });

                    if (empleadosInvalidos.size > 0 || variablesInvalidas.size > 0) {
                        let msjError = "Carga masiva cancelada. Debe corregir su archivo Excel:\n\n";
                        if (empleadosInvalidos.size > 0) msjError += `❌ Códigos de empleado no encontrados:\n${Array.from(empleadosInvalidos).join(', ')}\n\n`;
                        if (variablesInvalidas.size > 0) msjError += `❌ Códigos de variable no válidos:\n${Array.from(variablesInvalidas).join(', ')}\n`;
                        
                        return resolve({ success: false, error: msjError });
                    }

                    // Mapear filas exitosas
                    const filasExitosas = registrosExcel.map(item => {
                        const emp = empsDB.find(e => String(e.codigo_empleado) === item.cEmp);
                        const v = catalogos.variables.find(varItem => String(varItem.codigo_variable).toUpperCase() === item.cVar.toUpperCase());
                        
                        return {
                            id_temp: Math.random(),
                            codigo_empleado: item.cEmp,
                            empleado_nombre: emp.nombres_apellidos,
                            empleado_puesto: emp.puesto,
                            monto: formatoMoneda.format(item.monto),
                            codigo_variable: v.codigo_variable,
                            id_variable: v.id,
                            nombre_variable: v.nombre_variable
                        };
                    });

                    resolve({ success: true, data: filasExitosas });

                } catch (error) { 
                    console.error(error); 
                    resolve({ success: false, error: "Ocurrió un error al leer el archivo Excel." });
                }
            };
            
            reader.readAsArrayBuffer(excelFile);
        });
    };

    return { descargarPlantilla, procesarCargaMasiva };
};