import { useState, useEffect } from "react";
import {
  X,
  Upload,
  FileSpreadsheet,
  FileUp,
  AlertTriangle,
  Download,
} from "lucide-react";
import { Loader } from "../../components/Loader";
import { clientesService } from "./clientesService";
import { clienteImpuestosService } from "./clienteImpuestosService";
import { usuariosService } from "../usuarios/usuariosService";
import { impuestosService } from "../impuestos/impuestosService";
import * as XLSX from "xlsx";

interface ClienteCargaMasivaProps {
  onClose: () => void;
  onSuccess: () => void;
}

// Algoritmo nativo Dian para validación/generación del dígito de verificación
const calcularDV = (nit: string): number => {
  const vpri = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  let x = 0;
  const z = nit.length;
  for (let i = 0; i < z; i++) {
    const y = parseInt(nit.charAt(i), 10);
    x += y * vpri[z - 1 - i];
  }
  const y1 = x % 11;
  return y1 > 1 ? 11 - y1 : y1;
};

export const ClienteCargaMasiva = ({
  onClose,
  onSuccess,
}: ClienteCargaMasivaProps) => {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usuariosSistema, setUsuariosSistema] = useState<
    Record<string, string>
  >({});
  const [impuestosSistema, setImpuestosSistema] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    const cargarDiccionarios = async () => {
      try {
        const [users, taxes] = await Promise.all([
          usuariosService.getAll(),
          impuestosService.getAll(),
        ]);

        // Mapeos indexados O(1) para evitar consultas anidadas
        const userMap = users.reduce(
          (acc, u) => ({
            ...acc,
            [u.nombre_completo.toLowerCase().trim()]: u.id,
          }),
          {},
        );
        const taxMap = taxes.reduce(
          (acc, i) => ({ ...acc, [i.nombre.toUpperCase().trim()]: i.id }),
          {},
        );

        setUsuariosSistema(userMap);
        setImpuestosSistema(taxMap);
      } catch (err) {
        console.error("Error inicializando diccionarios de validación:", err);
      }
    };
    cargarDiccionarios();
  }, []);

  // FUNCIÓN SOLID: Generación dinámica del archivo plantilla modelo
  const handleDescargarModelo = () => {
    try {
      // 1. Definición de estructuras y datos demo guía
      const estructuraClientes = [
        ["NIT", "Razón Social", "Celular", "Correo", "Persona a Cargo"],
        [
          "900123456",
          "Inversiones Villarreal Romero S.A.S.",
          "3151234567",
          "contacto@villarreal.com",
          "Juan Perez",
        ],
      ];

      const estructuraObligaciones = [
        ["NIT del Cliente", "Nombre del Impuesto"],
        ["900123456", "IVA - BIMESTRAL"],
        ["900123456", "RETENCION EN LA FUENTE"],
      ];

      // 2. Creación del libro de trabajo (Workbook)
      const wb = XLSX.utils.book_new();

      // 3. Conversión de matrices a hojas de cálculo
      const wsClientes = XLSX.utils.aoa_to_sheet(estructuraClientes);
      const wsObligaciones = XLSX.utils.aoa_to_sheet(estructuraObligaciones);

      // 4. Inyección de las hojas respetando el orden estricto esperado
      XLSX.utils.book_append_sheet(wb, wsClientes, "Clientes");
      XLSX.utils.book_append_sheet(wb, wsObligaciones, "Obligaciones");

      // 5. Compilación del binario y disparo de la descarga local
      XLSX.writeFile(wb, "Plantilla_Carga_Masiva_Clientes.xlsx");
    } catch (error) {
      console.error("Error generando plantilla modelo:", error);
      alert("No se pudo generar la plantilla en este momento.");
    }
  };

  const handleProcesarExcel = async () => {
    if (!archivo) return alert("Por favor seleccione un archivo Excel.");

    try {
      setIsSubmitting(true);
      const windowReader = new FileReader();

      windowReader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });

          // --- VALIDACIÓN DE HOJAS ---
          if (workbook.SheetNames.length < 2) {
            throw new Error(
              "El archivo debe contener exactamente 2 hojas: 'Clientes' y 'Obligaciones'.",
            );
          }

          const hojaClientes = workbook.Sheets[workbook.SheetNames[0]];
          const hojaObligaciones = workbook.Sheets[workbook.SheetNames[1]];

          // Convertir matrices crudas
          const filasClientes = XLSX.utils.sheet_to_json<any[]>(hojaClientes, {
            header: 1,
          });
          const filasObligaciones = XLSX.utils.sheet_to_json<any[]>(
            hojaObligaciones,
            { header: 1 },
          );

          const clientesPayload: any[] = [];
          const nitToIdMapa: Record<string, string> = {};
          const nitToUltimoDigitoMapa: Record<string, number> = {};

          // --- PROCESAR HOJA 1: CLIENTES ---
          for (let i = 1; i < filasClientes.length; i++) {
            const row = filasClientes[i];
            if (!row || row.length === 0 || !row[0]) continue;

            const nit = String(row[0]).trim();
            const razonSocial = String(row[1] || "").trim();
            const celular = row[2] ? String(row[2]).trim() : null;
            const email = row[3] ? String(row[3]).trim() : null;
            const responsableStr = String(row[4] || "")
              .toLowerCase()
              .trim();

            if (!nit || !razonSocial || !responsableStr) {
              throw new Error(
                `Hoja 'Clientes' - Fila ${i + 1}: NIT, Razón Social y Responsable son obligatorios.`,
              );
            }

            const contadorId = usuariosSistema[responsableStr];
            if (!contadorId) {
              throw new Error(
                `Hoja 'Clientes' - Fila ${i + 1}: El responsable '${row[4]}' no existe en el sistema.`,
              );
            }

            const dv = calcularDV(nit);
            const ultimoDigito = Number(nit.slice(-1));

            clientesPayload.push({
              nit,
              dv,
              razon_social: razonSocial,
              celular: celular && /^3[0-9]{9}$/.test(celular) ? celular : null,
              email: email && email.includes("@") ? email : null,
              contador_id: contadorId,
              estado: "ACTIVO",
            });

            nitToUltimoDigitoMapa[nit] = ultimoDigito;
          }

          if (clientesPayload.length === 0)
            throw new Error(
              "No se encontraron registros válidos en la hoja de Clientes.",
            );

          // Insertar clientes y recuperar IDs autogenerados por Supabase
          const clientesCreados =
            await clientesService.createBulk(clientesPayload);
          clientesCreados.forEach((c) => {
            nitToIdMapa[c.nit] = c.id;
          });

          // --- PROCESAR HOJA 2: OBLIGACIONES ---
          const obligacionesPayload: any[] = [];
          const idToUltimoDigitoMapeado: Record<string, number> = {};

          for (let j = 1; j < filasObligaciones.length; j++) {
            const rowOb = filasObligaciones[j];
            if (!rowOb || rowOb.length === 0 || !rowOb[0]) continue;

            const nitBusqueda = String(rowOb[0]).trim();
            const impuestoStr = String(rowOb[1] || "")
              .toUpperCase()
              .trim();

            if (!nitBusqueda || !impuestoStr) {
              throw new Error(
                `Hoja 'Obligaciones' - Fila ${j + 1}: El NIT y el nombre de Impuesto son requeridos.`,
              );
            }

            const clienteId = nitToIdMapa[nitBusqueda];
            const impuestoId = impuestosSistema[impuestoStr];

            if (!clienteId) continue;
            if (!impuestoId) {
              throw new Error(
                `Hoja 'Obligaciones' - Fila ${j + 1}: El impuesto '${rowOb[1]}' no existe parametrizado en la plataforma.`,
              );
            }

            obligacionesPayload.push({
              cliente_id: clienteId,
              impuesto_id: impuestoId,
              estado: "ACTIVO",
            });

            idToUltimoDigitoMapeado[clienteId] =
              nitToUltimoDigitoMapa[nitBusqueda];
          }

          if (obligacionesPayload.length > 0) {
            await clienteImpuestosService.assignImpuestosBulk(
              obligacionesPayload,
              idToUltimoDigitoMapeado,
            );
          }

          alert(
            `¡Proceso Exitoso! Se crearon ${clientesCreados.length} clientes con sus respectivas agendas tributarias.`,
          );
          onSuccess();
        } catch (error: any) {
          alert(error.message || "Error al decodificar el Excel.");
          setIsSubmitting(false);
        }
      };

      windowReader.readAsBinaryString(archivo);
    } catch (error: any) {
      alert(error.message);
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
              Carga Masiva de Directorio Contable
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-surface/70 hover:text-surface transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {isSubmitting ? (
          <div className="p-12">
            <Loader
              texto="Estructurando datos y sembrando agendas automatizadas..."
              fullScreen={false}
            />
          </div>
        ) : (
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Botón de Descarga de Plantilla Modelo */}
            <div className="flex justify-between items-center p-3.5 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-primary block uppercase tracking-wide">
                  ¿No tienes el formato de carga?
                </span>
                <p className="text-xs text-text-muted">
                  Descarga un libro de ejemplo estructurado listo para
                  diligenciar.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDescargarModelo}
                className="bg-white border border-gray-300 hover:border-primary text-text-main hover:text-primary px-3 py-1.5 rounded-md flex items-center gap-2 text-xs font-bold transition-all shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-accent" />
                Descargar Plantilla Excel
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 space-y-1">
                <span className="font-bold uppercase block">
                  Requisitos del Libro de Excel:
                </span>
                <p>
                  <b>Hoja 1 (Clientes):</b> Columnas: NIT | Razón Social |
                  Celular | Correo | Persona a Cargo (Debe coincidir con el
                  nombre exacto del contador en el sistema).
                </p>
                <p>
                  <b>Hoja 2 (Obligaciones):</b> Columnas: NIT del Cliente |
                  Nombre del Impuesto (Debe coincidir con los nombres del
                  catálogo).
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-main mb-2">
                Selecciona la plantilla de Excel (.xlsx, .xls)
              </label>
              <label
                className={`flex justify-center w-full h-36 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-accent hover:bg-gray-50 focus:outline-none ${archivo ? "border-accent bg-blue-50/20" : ""}`}
              >
                <span className="flex flex-col items-center justify-center space-y-2">
                  <FileUp
                    className={`w-9 h-9 ${archivo ? "text-accent" : "text-gray-400"}`}
                  />
                  <span className="font-semibold text-xs text-gray-600">
                    {archivo
                      ? archivo.name
                      : "Arrastra tu libro contable aquí o haz clic para explorar"}
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

            <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 -mx-6 -mb-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-text-muted hover:bg-gray-200 rounded-md text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleProcesarExcel}
                disabled={!archivo}
                className="bg-primary hover:bg-primary/90 text-surface font-semibold px-6 py-2 rounded-md flex items-center gap-2 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <Upload className="w-4 h-4" />
                Procesar e Importar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
