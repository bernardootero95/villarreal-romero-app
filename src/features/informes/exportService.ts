import * as XLSX from "xlsx";
import type { MetricaVencimientosEmpleado } from "./types";

export const exportService = {
  exportarVencimientosExcel(
    datos: MetricaVencimientosEmpleado[],
    fechaInicio: string,
    fechaFin: string
  ): void {
    if (!datos || datos.length === 0) {
      alert("No hay datos disponibles para exportar en el período seleccionado.");
      return;
    }

    
    const datosMapeados = datos.map((emp) => ({
      "Especialista / Empleado": emp.nombre_completo,
      "Cargo": emp.cargo,
      "Total Asignado": emp.total_vencimientos,
      "Presentados a Tiempo": emp.presentados_a_tiempo,
      "Presentados Tarde": emp.presentados_tarde,
      "Pendientes en Plazo": emp.pendientes,
      "Vencidos": emp.vencidos,
      "Efectividad (%)": `${emp.porcentaje_efectividad}%`,
    }));

    
    const hoja = XLSX.utils.json_to_sheet(datosMapeados);

    
    const anchosColumnas = [
      { wch: 32 }, 
      { wch: 18 }, 
      { wch: 16 }, 
      { wch: 22 }, 
      { wch: 20 }, 
      { wch: 20 }, 
      { wch: 14 }, 
      { wch: 16 }, 
    ];
    hoja["!cols"] = anchosColumnas;

    
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Rendimiento Operativo");

    // 5. Generamos el archivo y disparamos la descarga en el navegador
    const nombreArchivo = `Informe_Rendimiento_${fechaInicio}_al_${fechaFin}.xlsx`;
    XLSX.writeFile(libro, nombreArchivo);
  },
};