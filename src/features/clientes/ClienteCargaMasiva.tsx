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
import { useCreateBulkClientes, useAsignarImpuestosBulk } from "./useClientes";
import { useUsuarios } from "../usuarios/useUsuarios";
import { useImpuestos } from "../impuestos/useImpuestos";
import { AlertNotification } from "../../components/ui/AlertNotification";
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
  const [usuariosSistema, setUsuariosSistema] = useState<
    Record<string, string>
  >({});
  const [impuestosSistema, setImpuestosSistema] = useState<
    Record<string, string>
  >({});
  const [errorProcesamiento, setErrorProcesamiento] = useState<string | null>(
    null,
  );
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const createBulkClientesMutation = useCreateBulkClientes();
  const asignarImpuestosBulkMutation = useAsignarImpuestosBulk();

  const { data: usuarios = [], isLoading: loadingUsers } = useUsuarios();
  const { data: impuestos = [], isLoading: loadingTaxes } = useImpuestos();

  useEffect(() => {
    if (usuarios.length > 0) {
      const userMap = usuarios.reduce(
        (acc, u) => ({
          ...acc,
          [u.nombre_completo.toLowerCase().trim()]: u.id,
        }),
        {},
      );
      setUsuariosSistema(userMap);
    }

    if (impuestos.length > 0) {
      const taxMap = impuestos.reduce((acc, i) => {
        const llaveCompuesta = `${i.nombre.toUpperCase().trim()}|${i.periodicidad.toUpperCase().trim()}`;
        return { ...acc, [llaveCompuesta]: i.id };
      }, {});
      setImpuestosSistema(taxMap);
    }
  }, [usuarios, impuestos]);

  const handleDescargarModelo = () => {
    try {
      setErrorProcesamiento(null);
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
        ...impuestos.map((t) => [
          t.nombre.toUpperCase(),
          t.periodicidad.toUpperCase(),
        ]),
      ];

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
      setErrorProcesamiento(
        "No se pudo compilar la estructura del archivo modelo Excel.",
      );
    }
  };

  const handleProcesarExcel = async () => {
    setErrorProcesamiento(null);
    setMensajeExito(null);

    if (!archivo) {
      setErrorProcesamiento(
        "Por favor seleccione un libro de Excel válido antes de ejecutar el cargue.",
      );
      return;
    }

    const windowReader = new FileReader();
    windowReader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });

        if (workbook.SheetNames.length < 2) {
          throw new Error(
            "El libro contable debe contener de manera obligatoria las pestañas: 'Clientes' y 'Obligaciones'.",
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
              `Pestaña 'Clientes' - Fila ${i + 1}: El campo NIT, Razón Social y Profesional a Cargo son obligatorios.`,
            );
          }

          const contadorId = usuariosSistema[responsableStr];
          if (!contadorId) {
            throw new Error(
              `Pestaña 'Clientes' - Fila ${i + 1}: El profesional '${row[4]}' no figura registrado o activo en la firma.`,
            );
          }

          const dv = calcularDV(nit);
          const ultimoDigito = Number(nit.slice(-1));

          clientesPayload.push({
            nit,
            dv,
            razon_social: razonSocial,
            celular:
              celularRaw && /^3[0-9]{9}$/.test(celularRaw) ? celularRaw : null,
            email: emailRaw && emailRaw.includes("@") ? emailRaw : null,
            contador_id: contadorId,
            estado: "ACTIVO",
          });

          nitToUltimoDigitoMapa[nit] = ultimoDigito;
        }

        if (clientesPayload.length === 0) {
          throw new Error(
            "No se detectaron filas legibles con estructuras de datos en la hoja de Clientes.",
          );
        }

        const clientesCreados =
          await createBulkClientesMutation.mutateAsync(clientesPayload);

        const nitToIdMapa: Record<string, string> = {};
        clientesCreados.forEach((c) => {
          nitToIdMapa[c.nit] = c.id;
        });

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
              `Pestaña 'Obligaciones' - Fila ${j + 1}: El NIT del Cliente, Nombre del Impuesto y su Periodicidad son obligatorios.`,
            );
          }

          const clienteId = nitToIdMapa[nitBusqueda];
          const llaveBusqueda = `${impuestoStr}|${periodicidadStr}`;
          const impuestoId = impuestosSistema[llaveBusqueda];

          if (!clienteId) continue;
          if (!impuestoId) {
            throw new Error(
              `Pestaña 'Obligaciones' - Fila ${j + 1}: No existe concordancia en el catálogo para el impuesto '${impuestoStr}' con periodicidad '${periodicidadStr}'.`,
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
          await asignarImpuestosBulkMutation.mutateAsync({
            obligaciones: obligacionesPayload,
            ultimoDigitoMapa: idToUltimoDigitoMapeado,
          });
        }

        setMensajeExito(
          `¡Directorio Importado! Se han indexado ${clientesCreados.length} empresas y estructurado todas sus agendas tributarias.`,
        );
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } catch (error: any) {
        setErrorProcesamiento(
          error.message ||
            "Ocurrió un conflicto al descomprimir las matrices de celdas.",
        );
      }
    };
    windowReader.readAsBinaryString(archivo);
  };

  const isMetadataLoading = loadingUsers || loadingTaxes;
  const isSubmitting =
    createBulkClientesMutation.isPending ||
    asignarImpuestosBulkMutation.isPending;

  return (
    <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden border border-text-muted/20 flex flex-col max-h-[90vh]">
        <div className="bg-primary p-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2 text-surface">
            <FileSpreadsheet className="w-5 h-5" />
            <h2 className="font-title font-semibold text-sm">
              Carga Masiva de Directorio Contable
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-surface/70 hover:text-surface transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {isMetadataLoading || isSubmitting ? (
          <div className="p-12">
            <Loader
              texto={
                isMetadataLoading
                  ? "Sincronizando catálogos de validación..."
                  : "Estructurando datos y sembrando agendas..."
              }
              fullScreen={false}
            />
          </div>
        ) : (
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            {errorProcesamiento && (
              <div className="animate-in fade-in duration-200">
                <AlertNotification
                  type="error"
                  title="Fallo de Importación"
                  message={errorProcesamiento}
                  onClose={() => setErrorProcesamiento(null)}
                />
              </div>
            )}

            {mensajeExito && (
              <div className="animate-in fade-in duration-200">
                <AlertNotification
                  type="success"
                  title="Estructuración Exitosa"
                  message={mensajeExito}
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3.5 bg-background border border-text-muted/20 rounded-lg">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-primary block uppercase tracking-wide">
                  ¿No tienes el formato de carga?
                </span>
                <p className="text-xs text-text-muted">
                  Descarga la matriz patrón estructurada con columnas unificadas
                  para el cargue masivo.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDescargarModelo}
                className="bg-surface border border-text-muted/30 hover:border-primary text-text-main hover:text-primary px-3 py-1.5 rounded-md flex items-center gap-2 text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-accent" />
                Descargar Plantilla Excel
              </button>
            </div>

            <div className="bg-warning/10 border border-warning/20 p-4 rounded-lg flex gap-3">
              <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div className="text-xs text-warning space-y-1">
                <span className="font-bold uppercase block">
                  Formato de las Columnas de Obligación:
                </span>
                <p>
                  <b>Hoja 1 (Clientes):</b> NIT | Razón Social | Celular |
                  Correo | Persona a Cargo
                </p>
                <p>
                  <b>Hoja 2 (Obligaciones):</b> NIT del Cliente | Nombre del
                  Impuesto (Ej. <i>IVA</i>) | Periodicidad (Ej. <i>BIMESTRAL</i>
                  ).
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-main mb-2">
                Selecciona la plantilla de Excel (.xlsx, .xls)
              </label>
              <label
                className={`flex justify-center w-full h-36 px-4 transition bg-surface border-2 border-dashed rounded-md appearance-none cursor-pointer hover:border-accent hover:bg-text-muted/5 focus:outline-none ${
                  archivo
                    ? "border-accent bg-primary/5"
                    : "border-text-muted/30"
                }`}
              >
                <span className="flex flex-col items-center justify-center space-y-2">
                  <FileUp
                    className={`w-9 h-9 ${archivo ? "text-accent" : "text-text-muted/50"}`}
                  />
                  <span className="font-semibold text-xs text-text-muted">
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
          </div>
        )}

        {!isSubmitting && !isMetadataLoading && (
          <div className="p-4 border-t border-text-muted/10 flex justify-end gap-3 shrink-0 bg-background">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-text-muted hover:bg-text-muted/10 rounded-md text-sm font-medium transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleProcesarExcel}
              disabled={!archivo || !!mensajeExito}
              className="bg-primary hover:bg-primary/90 text-surface font-semibold px-6 py-2 rounded-md flex items-center gap-2 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Procesar e Importar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
