import * as XLSX from "xlsx";
import type {
  MetricaVencimientosEmpleado,
  MetricaVencimientosImpuesto,
  DetalleVencimientoEmpleado,
  DetalleVencimientoImpuesto,
} from "./types";

export const exportService = {
  exportarVencimientosExcel(
    datos: MetricaVencimientosEmpleado[],
    fechaInicio: string,
    fechaFin: string,
  ): void {
    if (!datos || datos.length === 0) {
      alert("No hay datos disponibles para exportar en el período seleccionado.");
      return;
    }

    const datosMapeados = datos.map((emp) => ({
      "Especialista / Empleado": emp.nombre_completo,
      Cargo: emp.cargo,
      "Total Asignado": emp.total_vencimientos,
      "Presentados a Tiempo": emp.presentados_a_tiempo,
      "Presentados Tarde": emp.presentados_tarde,
      "Pendientes en Plazo": emp.pendientes,
      Vencidos: emp.vencidos,
      "Efectividad (%)": `${emp.porcentaje_efectividad}%`,
    }));

    const hoja = XLSX.utils.json_to_sheet(datosMapeados);
    hoja["!cols"] = [
      { wch: 32 },
      { wch: 18 },
      { wch: 16 },
      { wch: 22 },
      { wch: 20 },
      { wch: 20 },
      { wch: 14 },
      { wch: 16 },
    ];

    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Por Empleado");

    XLSX.writeFile(
      libro,
      `Informe_Por_Empleado_${fechaInicio}_al_${fechaFin}.xlsx`,
    );
  },

  exportarImpuestosExcel(
    datos: MetricaVencimientosImpuesto[],
    fechaInicio: string,
    fechaFin: string,
  ): void {
    if (!datos || datos.length === 0) {
      alert("No hay datos disponibles para exportar en el período seleccionado.");
      return;
    }

    const datosMapeados = datos.map((imp) => ({
      "Obligación Tributaria": imp.nombre,
      Periodicidad: imp.periodicidad,
      "Total Asignado": imp.total_vencimientos,
      "Presentados a Tiempo": imp.presentados_a_tiempo,
      "Presentados Tarde": imp.presentados_tarde,
      "Pendientes en Plazo": imp.pendientes,
      Vencidos: imp.vencidos,
      "Efectividad (%)": `${imp.porcentaje_efectividad}%`,
    }));

    const hoja = XLSX.utils.json_to_sheet(datosMapeados);
    hoja["!cols"] = [
      { wch: 35 },
      { wch: 18 },
      { wch: 16 },
      { wch: 22 },
      { wch: 20 },
      { wch: 20 },
      { wch: 14 },
      { wch: 16 },
    ];

    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Por Impuesto");

    XLSX.writeFile(
      libro,
      `Informe_Por_Impuesto_${fechaInicio}_al_${fechaFin}.xlsx`,
    );
  },

  exportarDetalleEmpleadoExcel(
    datos: DetalleVencimientoEmpleado[],
    nombreEmpleado: string,
    fechaInicio: string,
    fechaFin: string,
  ): void {
    if (!datos || datos.length === 0) {
      alert("No hay registros disponibles para exportar.");
      return;
    }

    const dicClasificacion: Record<string, string> = {
      A_TIEMPO: "Presentado a Tiempo",
      TARDE: "Presentado Tarde",
      PENDIENTE: "Pendiente en Plazo",
      VENCIDO: "Vencido",
    };

    const datosMapeados = datos.map((item) => ({
      "Cliente / Razón Social": item.razon_social,
      NIT: `${item.nit}-${item.dv}`,
      "Obligación Tributaria": item.impuesto_nombre,
      "Período Fiscal": item.periodo_fiscal,
      "Fecha Límite DIAN": item.fecha_limite,
      "Fecha Radicación": item.fecha_radicacion || "N/A",
      "Estado Operativo": dicClasificacion[item.clasificacion] || item.clasificacion,
      "Radicado / Observaciones": item.observaciones || "Sin observaciones",
    }));

    const hoja = XLSX.utils.json_to_sheet(datosMapeados);
    hoja["!cols"] = [
      { wch: 35 },
      { wch: 18 },
      { wch: 28 },
      { wch: 16 },
      { wch: 18 },
      { wch: 18 },
      { wch: 22 },
      { wch: 35 },
    ];

    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Auditoría Empleado");

    const nombreLimpio = nombreEmpleado.replace(/\s+/g, "_");
    XLSX.writeFile(
      libro,
      `Detalle_${nombreLimpio}_${fechaInicio}_al_${fechaFin}.xlsx`,
    );
  },

  exportarDetalleImpuestoExcel(
    datos: DetalleVencimientoImpuesto[],
    nombreImpuesto: string,
    fechaInicio: string,
    fechaFin: string,
  ): void {
    if (!datos || datos.length === 0) {
      alert("No hay registros disponibles para exportar.");
      return;
    }

    const dicClasificacion: Record<string, string> = {
      A_TIEMPO: "Presentado a Tiempo",
      TARDE: "Presentado Tarde",
      PENDIENTE: "Pendiente en Plazo",
      VENCIDO: "Vencido",
    };

    const datosMapeados = datos.map((item) => ({
      "Cliente / Razón Social": item.razon_social,
      NIT: `${item.nit}-${item.dv}`,
      "Contador Asignado": item.contador_nombre,
      "Período Fiscal": item.periodo_fiscal,
      "Fecha Límite DIAN": item.fecha_limite,
      "Fecha Radicación": item.fecha_radicacion || "N/A",
      "Estado Operativo": dicClasificacion[item.clasificacion] || item.clasificacion,
      "Radicado / Observaciones": item.observaciones || "Sin observaciones",
    }));

    const hoja = XLSX.utils.json_to_sheet(datosMapeados);
    hoja["!cols"] = [
      { wch: 35 },
      { wch: 18 },
      { wch: 28 },
      { wch: 16 },
      { wch: 18 },
      { wch: 18 },
      { wch: 22 },
      { wch: 35 },
    ];

    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Auditoría Impuesto");

    const nombreLimpio = nombreImpuesto.replace(/\s+/g, "_");
    XLSX.writeFile(
      libro,
      `Detalle_Impuesto_${nombreLimpio}_${fechaInicio}_al_${fechaFin}.xlsx`,
    );
  },
};