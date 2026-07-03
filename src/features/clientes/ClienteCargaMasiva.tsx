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
  const [listaImpuestosRaw, setListaImpuestosRaw] = useState<
    Array<{ nombre: string; periodicidad: string }>
  >([]);

  useEffect(() => {
    const cargarDiccionarios = async () => {
      try {
        const [users, taxes] = await Promise.all([
          usuariosService.getAll(),
          impuestosService.getAll(),
        ]);

        setListaImpuestosRaw(
          taxes.map((t) => ({
            nombre: t.nombre,
            periodicidad: t.periodicidad,
          })),
        );

        const userMap = users.reduce(
          (acc, u) => ({
            ...acc,
            [u.nombre_completo.toLowerCase().trim()]: u.id,
          }),
          {},
        );

        const taxMap = taxes.reduce((acc, i) => {
          const llaveCompuesta = `${i.nombre.toUpperCase().trim()}|${i.periodicidad.toUpperCase().trim()}`;
          return { ...acc, [llaveCompuesta]: i.id };
        }, {});

        setUsuariosSistema(userMap);
        setImpuestosSistema(taxMap);
      } catch (err) {
        console.error("Error inicializando diccionarios de validación:", err);
      }
    };
    cargarDiccionarios();
  }, []);

  const handleDescargarModelo = () => {
    try {
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
        ["NIT del Cliente", "Nombre del Impuesto", "Periodicidad"],
        ["900123456", "IVA", "BIMESTRAL"],
        ["900123456", "IVA", "CUATRIMESTRAL"],
        ["900123456", "RETENCION EN LA FUENTE", "MENSUAL"],
      ];

      const estructuraGuiaImpuestos = [
        ["Nombre del Impuesto", "Periodicidad Permitida"],
        ...listaImpuestosRaw.map((t) => [
          t.nombre.toUpperCase(),
          t.periodicidad.toUpperCase(),
        ]),
      ];

      if (estructuraGuiaImpuestos.length === 1) {
        estructuraGuiaImpuestos.push(["IVA", "BIMESTRAL"]);
        estructuraGuiaImpuestos.push(["IVA", "CUATRIMESTRAL"]);
      }

      const wb = XLSX.utils.book_new();
      const wsClientes = XLSX.utils.aoa_to_sheet(estructuraClientes);
      const wsObligaciones = XLSX.utils.aoa_to_sheet(estructuraObligaciones);
      const wsGuia = XLSX.utils.aoa_to_sheet(estructuraGuiaImpuestos);

      XLSX.utils.book_append_sheet(wb, wsClientes, "Clientes");
      XLSX.utils.book_append_sheet(wb, wsObligaciones, "Obligaciones");
      XLSX.utils.book_append_sheet(wb, wsGuia, "Impuestos y Periodicidades");

      XLSX.writeFile(wb, "Plantilla_Carga_Masiva_VR.xlsx");
    } catch (error) {
      console.error("Error generando plantilla modelo:", error);
      alert("No se pudo generar la plantilla.");
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

          if (workbook.SheetNames.length < 2) {
            throw new Error(
              "El archivo debe contener al menos las hojas: 'Clientes' y 'Obligaciones'.",
            );
          }

          const hojaClientes = workbook.Sheets[workbook.SheetNames[0]];
          const hojaObligaciones = workbook.Sheets[workbook.SheetNames[1]];

          const filasClientes = XLSX.utils.sheet_to_json<any[]>(hojaClientes, {
            header: 1,
            defval: null,
          });
          const filasObligaciones = XLSX.utils.sheet_to_json<any[]>(
            hojaObligaciones,
            { header: 1, defval: null },
          );

          const clientesPayload: any[] = [];
          const nitToUltimoDigitoMapa: Record<string, number> = {};

          // --- PASO 1: MAPEAR Y VALIDAR CLIENTES LOCALES ---
          for (let i = 1; i < filasClientes.length; i++) {
            const row = filasClientes[i];
            if (!row || row.length === 0 || row[0] === null) continue;

            const nit = String(row[0]).trim();
            const razonSocial = row[1] ? String(row[1]).trim() : null;
            const celularRaw = row[2] ? String(row[2]).trim() : null;
            const emailRaw = row[3] ? String(row[3]).trim() : null;
            const responsableStr = row[4]
              ? String(row[4]).toLowerCase().trim()
              : null;

            if (!nit || !razonSocial || !responsableStr) {
              throw new Error(
                `Hoja 'Clientes' - Fila ${i + 1}: El NIT, la Razón Social y el Responsable son obligatorios.`,
              );
            }

            const contadorId = usuariosSistema[responsableStr];
            if (!contadorId) {
              throw new Error(
                `Hoja 'Clientes' - Fila ${i + 1}: El responsable '${row[4]}' no se encuentra registrado o activo en la base de datos.`,
              );
            }

            const dv = calcularDV(nit);
            const ultimoDigito = Number(nit.slice(-1));

            clientesPayload.push({
              nit,
              dv,
              razon_social: razonSocial,
              celular:
                celularRaw && /^3[0-9]{9}$/.test(celularRaw)
                  ? celularRaw
                  : null,
              email: emailRaw && emailRaw.includes("@") ? emailRaw : null,
              contador_id: contadorId,
              estado: "ACTIVO",
            });

            nitToUltimoDigitoMapa[nit] = ultimoDigito;
          }

          if (clientesPayload.length === 0)
            throw new Error(
              "No se hallaron registros legibles en la hoja de Clientes.",
            );

          // --- PASO 2: INSERCIÓN EFECTIVA DE CLIENTES (Asegurar persistencia en BD) ---
          const clientesCreados =
            await clientesService.createBulk(clientesPayload);

          // Construimos el mapa de mapeo definitivo usando lo retornado de forma real por la BD
          const nitToIdMapa: Record<string, string> = {};
          clientesCreados.forEach((c) => {
            nitToIdMapa[c.nit] = c.id;
          });

          // --- PASO 3: PROCESAR HOJA DE OBLIGACIONES ASOCIANDO LOS IDS VERDADEROS ---
          const obligacionesPayload: any[] = [];
          const idToUltimoDigitoMapeado: Record<string, number> = {};

          for (let j = 1; j < filasObligaciones.length; j++) {
            const rowOb = filasObligaciones[j];
            if (!rowOb || rowOb.length === 0 || rowOb[0] === null) continue;

            const nitBusqueda = String(rowOb[0]).trim();
            const impuestoStr = rowOb[1]
              ? String(rowOb[1]).toUpperCase().trim()
              : null;
            const periodicidadStr = rowOb[2]
              ? String(rowOb[2]).toUpperCase().trim()
              : null;

            if (!nitBusqueda || !impuestoStr || !periodicidadStr) {
              throw new Error(
                `Hoja 'Obligaciones' - Fila ${j + 1}: El NIT, nombre del Impuesto y su Periodicidad son requeridos.`,
              );
            }

            const clienteId = nitToIdMapa[nitBusqueda];
            const llaveBusqueda = `${impuestoStr}|${periodicidadStr}`;
            const impuestoId = impuestosSistema[llaveBusqueda];

            if (!clienteId) continue; // Si el cliente falló o fue omitido, salta la obligación de manera segura
            if (!impuestoId) {
              throw new Error(
                `Hoja 'Obligaciones' - Fila ${j + 1}: No existe un impuesto parametrizado con el nombre '${impuestoStr}' y periodicidad '${periodicidadStr}'.`,
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

          // --- PASO 4: AGREGAR OBLIGACIONES E INYECTAR CALENDARIOS AUTOMÁTICOS ---
          if (obligacionesPayload.length > 0) {
            await clienteImpuestosService.asignarImpuestosBulk(
              obligacionesPayload,
              idToUltimoDigitoMapeado,
            );
          }

          alert(
            `¡Proceso Exitoso! Se crearon ${clientesCreados.length} clientes y se sembraron todas sus obligaciones fiscales correctamente.`,
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
            <div className="flex justify-between items-center p-3.5 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-primary block uppercase tracking-wide">
                  ¿No tienes el formato de carga?
                </span>
                <p className="text-xs text-text-muted">
                  Descarga el nuevo formato con columnas independientes para
                  Impuesto y Periodicidad.
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
                  Formato de las Columnas de Obligación:
                </span>
                <p>
                  <b>Hoja 1 (Clientes):</b> NIT | Razón Social | Celular |
                  Correo | Persona a Cargo
                </p>
                <p>
                  <b>Hoja 2 (Obligaciones):</b> NIT del Cliente | Nombre del
                  Impuesto (Ej. <i>IVA</i>) | Periodicidad (Ej. <i>BIMESTRAL</i>{" "}
                  o <i>CUATRIMESTRAL</i>).
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
