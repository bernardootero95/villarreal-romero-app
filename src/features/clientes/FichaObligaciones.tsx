import { useEffect, useState } from "react";
import { X, Landmark, Plus, Trash2, ShieldAlert } from "lucide-react";
import { clienteImpuestosService } from "./clienteImpuestosService";
import { impuestosService } from "../impuestos/impuestosService";
import type { ClienteConContador } from "./types";
import type { ImpuestoConEspecialista } from "../impuestos/types";

interface FichaObligacionesProps {
  cliente: ClienteConContador;
  onClose: () => void;
}

export const FichaObligaciones = ({
  cliente,
  onClose,
}: FichaObligacionesProps) => {
  const [obligaciones, setObligaciones] = useState<any[]>([]);
  const [catImpuestos, setCatImpuestos] = useState<ImpuestoConEspecialista[]>(
    [],
  );
  const [selectedImpuesto, setSelectedImpuesto] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Extraer el último dígito del NIT para la automatización
  const ultimoDigito = Number(cliente.nit.slice(-1));

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [misObligaciones, todoElCat] = await Promise.all([
        clienteImpuestosService.getImpuestosPorCliente(cliente.id),
        impuestosService.getAll(),
      ]);
      setObligaciones(misObligaciones);
      setCatImpuestos(todoElCat.filter((i) => i.estado === "ACTIVO"));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [cliente.id]);

  const handleAsignar = async () => {
    if (!selectedImpuesto) return;
    try {
      setSubmitting(true);
      await clienteImpuestosService.asignarImpuesto(
        cliente.id,
        selectedImpuesto,
        ultimoDigito,
      );
      setSelectedImpuesto("");
      cargarDatos();
    } catch (error: any) {
      alert(error.message || "Error al asignar la obligación");
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuitar = async (asignacionId: string, impuestoId: string) => {
    if (
      window.confirm(
        "¿Confirmas que deseas quitar esta obligación? Se guardará el histórico y se eliminarán del calendario todas las tareas futuras que sigan PENDIENTES.",
      )
    ) {
      try {
        setLoading(true);
        await clienteImpuestosService.desasignarImpuesto(
          asignacionId,
          cliente.id,
          impuestoId,
        );
        cargarDatos();
      } catch (error) {
        alert("Error al remover la obligación");
      }
    }
  };

  // Filtrar el catálogo para no mostrar impuestos que ya tiene asignados
  const impuestosDisponibles = catImpuestos.filter(
    (cat) => !obligaciones.some((obl) => obl.impuestos?.id === cat.id),
  );

  return (
    <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col max-h-[85vh]">
        <div className="bg-primary p-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2 text-surface">
            <Landmark className="w-5 h-5 text-accent" />
            <div>
              <h2 className="font-title font-semibold text-sm md:text-base">
                Obligaciones Tributarias
              </h2>
              <p className="text-[11px] text-surface/70 font-mono">
                Ficha: {cliente.razon_social} | NIT: {cliente.nit}-{cliente.dv}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-surface/70 hover:text-surface transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* SECCIÓN 1: ASIGNAR NUEVA OBLIGACIÓN */}
          <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl space-y-3">
            <h3 className="text-xs uppercase font-bold tracking-wider text-text-main flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-accent" /> Registrar Nueva
              Obligación
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={selectedImpuesto}
                onChange={(e) => setSelectedImpuesto(e.target.value)}
                disabled={submitting || loading}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-surface text-sm outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="">
                  Selecciona una obligación del catálogo...
                </option>
                {impuestosDisponibles.map((imp) => (
                  <option key={imp.id} value={imp.id}>
                    {imp.nombre} ({imp.periodicidad})
                  </option>
                ))}
              </select>
              <button
                onClick={handleAsignar}
                disabled={submitting || !selectedImpuesto}
                className="bg-primary text-surface px-5 py-2 rounded-md font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-50 whitespace-nowrap"
              >
                Vincular e Inyectar
              </button>
            </div>
            <p className="text-[10px] text-text-muted">
              * El sistema usará automáticamente el dígito <b>{ultimoDigito}</b>{" "}
              para sembrar la agenda de vencimientos en tiempo real.
            </p>
          </div>

          {/* SECCIÓN 2: TABLA DE OBLIGACIONES ACTUALES */}
          <div className="space-y-2">
            <h3 className="text-xs uppercase font-bold tracking-wider text-text-muted">
              Obligaciones Activas de la Empresa
            </h3>

            {loading ? (
              <p className="text-sm text-text-muted text-center py-6">
                Consultando ficha técnica...
              </p>
            ) : obligaciones.length === 0 ? (
              <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center text-text-muted space-y-1">
                <ShieldAlert className="w-8 h-8 text-text-muted/40 mx-auto" />
                <p className="text-sm font-medium">
                  Esta empresa no tiene obligaciones asignadas.
                </p>
                <p className="text-xs">
                  Usa el panel superior para inyectar su cronograma fiscal.
                </p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 text-text-muted text-[10px] uppercase tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Impuesto</th>
                      <th className="px-4 py-3 font-semibold text-center">
                        Periodicidad
                      </th>
                      <th className="px-4 py-3 font-semibold text-right">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {obligaciones.map((obl) => (
                      <tr key={obl.id} className="hover:bg-gray-50/40">
                        <td className="px-4 py-3 font-semibold text-primary">
                          {obl.impuestos?.nombre}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-xs font-mono font-medium bg-gray-100 px-2 py-0.5 rounded text-text-main">
                            {obl.impuestos?.periodicidad}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() =>
                              handleQuitar(obl.id, obl.impuestos?.id)
                            }
                            className="text-text-muted hover:text-danger p-1 transition-colors"
                            title="Quitar obligación"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
