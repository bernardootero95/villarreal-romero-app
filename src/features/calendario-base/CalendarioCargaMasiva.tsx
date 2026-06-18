import { useState, useEffect } from "react";
import { X, Upload, FileSpreadsheet } from "lucide-react";
import { calendarioBaseService } from "./calendarioBaseService";
import { impuestosService } from "../impuestos/impuestosService";
import type { ImpuestoConEspecialista } from "../impuestos/types";

interface CalendarioCargaMasivaProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CalendarioCargaMasiva = ({
  onClose,
  onSuccess,
}: CalendarioCargaMasivaProps) => {
  const [impuestos, setImpuestos] = useState<ImpuestoConEspecialista[]>([]);
  const [selectedImpuesto, setSelectedImpuesto] = useState("");
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [rawData, setRawData] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    impuestosService
      .getAll()
      .then((data) => setImpuestos(data.filter((i) => i.estado === "ACTIVO")));
  }, []);

  const handleCargaMasiva = async () => {
    if (!selectedImpuesto) return alert("Debes seleccionar un impuesto");
    if (!rawData.trim())
      return alert("Debes pegar los datos en el área de texto");

    try {
      setIsSubmitting(true);
      // 1. Separar por saltos de línea (filas de Excel)
      const lineas = rawData
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l !== "");

      const registros = lineas.map((linea) => {
        // 2. Separar por tabulación (copiado de Excel) o punto y coma
        const columnas = linea.split(/[\t;]/).map((c) => c.trim());

        // Asumimos que el usuario pegó 3 columnas: PERIODO | DIGITO | FECHA
        return {
          impuesto_id: selectedImpuesto,
          anio: anio,
          periodo: columnas[0] || "",
          digito:
            columnas[1] === "" || columnas[1].toUpperCase() === "N/A"
              ? null
              : Number(columnas[1]),
          fecha_vencimiento_oficial: columnas[2] || "",
        };
      });

      // 3. Validación rápida antes de enviar
      const invalidos = registros.filter(
        (r) => !r.periodo || !r.fecha_vencimiento_oficial,
      );
      if (invalidos.length > 0) {
        throw new Error(
          "Hay filas con datos incompletos. Asegúrate de tener las 3 columnas: Periodo, Dígito y Fecha (AAAA-MM-DD).",
        );
      }

      await calendarioBaseService.createBulk(registros as any);
      alert(`¡Éxito! Se cargaron ${registros.length} fechas correctamente.`);
      onSuccess();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col max-h-[90vh]">
        <div className="bg-primary p-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2 text-surface">
            <FileSpreadsheet className="w-5 h-5" />
            <h2 className="font-title font-semibold">
              Carga Masiva desde Excel
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-surface/70 hover:text-surface transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-main mb-1">
                1. Impuesto a cargar
              </label>
              <select
                value={selectedImpuesto}
                onChange={(e) => setSelectedImpuesto(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-accent outline-none"
              >
                <option value="">Seleccione...</option>
                {impuestos.map((imp) => (
                  <option key={imp.id} value={imp.id}>
                    {imp.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-main mb-1">
                2. Año Fiscal
              </label>
              <input
                type="number"
                value={anio}
                onChange={(e) => setAnio(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-accent outline-none"
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
            <h3 className="text-sm font-bold text-blue-800 mb-2">
              3. Instrucciones de pegado
            </h3>
            <p className="text-xs text-blue-700 mb-2">
              Copia desde Excel o Google Sheets estrictamente <b>3 columnas</b>{" "}
              en este orden y pégalas en el cuadro de abajo:
            </p>
            <table className="w-full text-xs text-left bg-white border border-blue-200">
              <thead className="bg-blue-100 text-blue-800">
                <tr>
                  <th className="p-1.5 border-b border-blue-200">
                    Columna 1: Periodo
                  </th>
                  <th className="p-1.5 border-b border-blue-200">
                    Columna 2: Dígito
                  </th>
                  <th className="p-1.5 border-b border-blue-200">
                    Columna 3: Fecha Límite
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-1.5 border-b border-blue-100">B1</td>
                  <td className="p-1.5 border-b border-blue-100">0</td>
                  <td className="p-1.5 border-b border-blue-100">2026-05-10</td>
                </tr>
                <tr>
                  <td className="p-1.5">B1</td>
                  <td className="p-1.5">1</td>
                  <td className="p-1.5">2026-05-11</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <textarea
              value={rawData}
              onChange={(e) => setRawData(e.target.value)}
              placeholder="Pega aquí los datos desde Excel..."
              className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-accent outline-none font-mono text-sm whitespace-pre"
            ></textarea>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 shrink-0 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-text-muted hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleCargaMasiva}
            disabled={isSubmitting || !selectedImpuesto || !rawData}
            className="bg-accent hover:bg-accent/90 text-primary font-semibold px-6 py-2 rounded-md flex items-center gap-2 transition-all shadow-md disabled:opacity-70"
          >
            <Upload className="w-4 h-4" />
            {isSubmitting ? "Procesando..." : "Subir y Procesar"}
          </button>
        </div>
      </div>
    </div>
  );
};
