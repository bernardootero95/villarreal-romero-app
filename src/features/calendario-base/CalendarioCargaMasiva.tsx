import { useState } from "react";
import { X, Upload, FileSpreadsheet, FileUp } from "lucide-react";
import { calendarioBaseService } from "./calendarioBaseService";
import { AlertNotification } from "../../components/ui/AlertNotification";
import * as XLSX from "xlsx";

interface CalendarioCargaMasivaProps {
  onClose: () => void;
  onSuccess: () => void;
  impuestoId: string;
}

export const CalendarioCargaMasiva = ({
  onClose,
  onSuccess,
  impuestoId,
}: CalendarioCargaMasivaProps) => {
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [archivo, setArchivo] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errorProcesamiento, setErrorProcesamiento] = useState<string | null>(
    null,
  );
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const procesarFechaExcel = (fechaStr: any) => {
    if (!fechaStr) return "";
    const parts = String(fechaStr).split(/[-/]/);
    if (parts.length === 3) {
      const [p1, p2, p3] = parts;
      if (p1.length === 4)
        return `${p1}-${p2.padStart(2, "0")}-${p3.padStart(2, "0")}`;
      if (p3.length === 4)
        return `${p3}-${p2.padStart(2, "0")}-${p1.padStart(2, "0")}`;
    }
    return String(fechaStr).trim();
  };

  const handleCargaMasiva = async () => {
    setErrorProcesamiento(null);
    setMensajeExito(null);

    if (!archivo) {
      setErrorProcesamiento(
        "Debes seleccionar un archivo válido de Excel (.xlsx, .xls) antes de proceder.",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary", cellDates: true });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, {
            header: 1,
            raw: false,
            dateNF: "yyyy-mm-dd",
          });

          const registrosValidos = [];

          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0 || !row[0]) continue;

            const periodo = String(row[0] || "").trim();
            const digitoStr = String(row[1] || "").trim();
            const fechaStr = procesarFechaExcel(row[2]);

            if (!periodo || !fechaStr) {
              throw new Error(
                `Fila ${i + 1} incompleta: Falta definir el periodo fiscal o la fecha límite.`,
              );
            }

            registrosValidos.push({
              impuesto_id: impuestoId,
              anio: anio,
              periodo: periodo,
              digito:
                digitoStr === "" || digitoStr.toUpperCase() === "N/A"
                  ? null
                  : Number(digitoStr),
              fecha_vencimiento_oficial: fechaStr,
            });
          }

          if (registrosValidos.length === 0) {
            throw new Error(
              "El archivo no contiene registros válidos para procesar o carece del formato requerido.",
            );
          }

          await calendarioBaseService.createBulk(registrosValidos as any);

          setMensajeExito(
            `¡Estructura sembrada! Se procesaron e indexaron ${registrosValidos.length} fechas oficiales con éxito.`,
          );

          setTimeout(() => {
            onSuccess();
          }, 1500);
        } catch (error: any) {
          setErrorProcesamiento(
            error.message ||
              "Error al decodificar la matriz del archivo Excel.",
          );
          setIsSubmitting(false);
        }
      };

      reader.readAsBinaryString(archivo);
    } catch (error: any) {
      setErrorProcesamiento(
        error.message ||
          "Fallo crítico en el hilo de lectura del almacenamiento local.",
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col max-h-[90vh]">
        <div className="bg-primary p-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2 text-surface">
            <FileSpreadsheet className="w-5 h-5" />
            <h2 className="font-title font-semibold text-sm">
              Carga Masiva de Fechas Oficiales
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-surface/70 hover:text-surface transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorProcesamiento && (
            <div className="animate-in fade-in duration-200">
              <AlertNotification
                type="error"
                title="Fallo de Procesamiento"
                message={errorProcesamiento}
                onClose={() => setErrorProcesamiento(null)}
              />
            </div>
          )}

          {mensajeExito && (
            <div className="animate-in fade-in duration-200">
              <AlertNotification
                type="success"
                title="Carga Exitosa"
                message={mensajeExito}
              />
            </div>
          )}

          <div className="max-w-xs">
            <label className="block text-xs font-bold text-text-muted uppercase mb-1">
              Año Fiscal del Reporte
            </label>
            <input
              type="number"
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-accent outline-none text-sm bg-surface"
            />
          </div>

          <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
            <h3 className="text-xs font-bold text-blue-800 mb-2 uppercase tracking-wide">
              Estructura obligatoria del Excel
            </h3>
            <ul className="text-xs text-blue-700 list-disc list-inside space-y-1">
              <li>
                <b>Columna A:</b> Periodo (Ej. 01, B1, ANUAL)
              </li>
              <li>
                <b>Columna B:</b> Dígito NIT (0-9. Dejar vacío o N/A si es Fecha
                Fija)
              </li>
              <li>
                <b>Columna C:</b> Fecha de Vencimiento (Formato AAAA-MM-DD)
              </li>
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-main mb-1">
              Selecciona tu archivo Excel (.xlsx, .xls)
            </label>
            <label
              className={`mt-2 flex justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-accent hover:bg-gray-50 focus:outline-none ${archivo ? "border-accent bg-blue-50/30" : ""}`}
            >
              <span className="flex flex-col items-center justify-center space-y-2">
                <FileUp
                  className={`w-8 h-8 ${archivo ? "text-accent" : "text-gray-400"}`}
                />
                <span className="font-medium text-xs text-gray-600">
                  {archivo
                    ? archivo.name
                    : "Haz clic para explorar o arrastra el archivo aquí"}
                </span>
              </span>
              <input
                type="file"
                className="hidden"
                accept=".xlsx, .xls"
                onChange={(e) => setArchivo(e.target.files?.[0] || null)}
              />
            </label>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 shrink-0 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-text-muted hover:bg-gray-200 rounded-md transition-colors text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleCargaMasiva}
            disabled={isSubmitting || !archivo || !!mensajeExito}
            className="bg-accent hover:bg-accent/90 text-primary font-semibold px-6 py-2 rounded-md flex items-center gap-2 transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed text-sm"
          >
            <Upload className="w-4 h-4" />
            {isSubmitting ? "Procesando archivo..." : "Subir y Procesar"}
          </button>
        </div>
      </div>
    </div>
  );
};
