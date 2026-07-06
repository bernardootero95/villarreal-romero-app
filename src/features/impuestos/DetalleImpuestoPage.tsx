import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  ArrowLeft,
  Calendar,
  Filter,
  AlertCircle,
  CalendarDays,
  Plus,
  Upload,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { impuestosService } from "./impuestosService";
import { calendarioBaseService } from "../calendario-base/calendarioBaseService";
import type { ImpuestoConEspecialista } from "./types";
import type { CalendarioBaseConImpuesto } from "../calendario-base/types";

import { CalendarioBaseForm } from "../calendario-base/CalendarioBaseForm";
import { CalendarioCargaMasiva } from "../calendario-base/CalendarioCargaMasiva";

const REGISTROS_POR_PAGINA = 10;

export const DetalleImpuestoPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { perfil } = useAuth();

  const [impuesto, setImpuesto] = useState<ImpuestoConEspecialista | null>(
    null,
  );
  const [fechasBase, setFechasBase] = useState<CalendarioBaseConImpuesto[]>([]);
  const [loading, setLoading] = useState(true);

  const [anioFiltro, setAnioFiltro] = useState(new Date().getFullYear());
  const [periodoFiltro, setPeriodoFiltro] = useState<string>("TODOS");

  const [paginaActual, setPaginaActual] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [fechaEditando, setFechaEditando] =
    useState<CalendarioBaseConImpuesto | null>(null);

  const puedeAdministrar =
    perfil && ["Gerente", "Ingeniero"].includes(perfil.cargo);

  const cargarImpuesto = async () => {
    if (!id) return;
    try {
      const data = await impuestosService.getAll();
      const encontrado = data.find((i) => i.id === id);
      if (encontrado) setImpuesto(encontrado);
    } catch (error) {
      console.error("Error cargando metadatos del impuesto:", error);
    }
  };

  const cargarCalendarioBase = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await calendarioBaseService.getAll(anioFiltro);
      const filtradasPorImpuesto = data.filter((f) => f.impuesto_id === id);
      setFechasBase(filtradasPorImpuesto);
      setPaginaActual(1); // Reiniciar a la primera página al cambiar año
    } catch (error) {
      console.error("Error cargando matriz de fechas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarImpuesto();
  }, [id]);

  useEffect(() => {
    cargarCalendarioBase();
  }, [id, anioFiltro]);

  const handleDeleteFecha = async (fechaId: string) => {
    if (
      window.confirm(
        "¿Deseas eliminar esta fecha oficial? Solo podrás hacerlo si no ha sido usada para generar vencimientos reales a clientes.",
      )
    ) {
      try {
        await calendarioBaseService.delete(fechaId);
        cargarCalendarioBase();
      } catch (error: any) {
        alert(error.message || "Error al remover la fecha");
      }
    }
  };

  const periodosDisponibles = Array.from(
    new Set(fechasBase.map((f) => f.periodo)),
  ).sort();

  const fechasFiltradas = fechasBase.filter((f) => {
    if (periodoFiltro === "TODOS") return true;
    return f.periodo === periodoFiltro;
  });

  const totalRegistros = fechasFiltradas.length;
  const totalPaginas = Math.ceil(totalRegistros / REGISTROS_POR_PAGINA);

  const indiceInicial = (paginaActual - 1) * REGISTROS_POR_PAGINA;
  const indiceFinal = indiceInicial + REGISTROS_POR_PAGINA;

  const fechasPaginadas = fechasFiltradas.slice(indiceInicial, indiceFinal);

  const handlePeriodoChange = (valor: string) => {
    setPeriodoFiltro(valor);
    setPaginaActual(1);
  };

  if (!impuesto) {
    return (
      <div className="text-center p-8 space-y-4">
        <AlertCircle className="w-12 h-12 text-danger mx-auto" />
        <h3 className="text-lg font-bold text-primary">
          Impuesto No Encontrado
        </h3>
        <button
          onClick={() => navigate("/impuestos")}
          className="bg-primary text-surface px-4 py-2 rounded-lg text-sm"
        >
          Regresar al Catálogo
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate("/impuestos")}
          className="flex items-center gap-2 text-sm font-medium text-text-muted hover:text-primary transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Volver al Catálogo
        </button>

        {puedeAdministrar && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowBulkForm(true)}
              className="bg-surface border border-gray-200 text-text-main px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-all text-xs font-semibold shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5 text-accent" />
              Carga Masiva Excel
            </button>
            <button
              onClick={() => {
                setFechaEditando(null);
                setShowForm(true);
              }}
              className="bg-primary text-surface px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-all text-xs font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Agregar Periodo / Fecha
            </button>
          </div>
        )}
      </div>

      <div className="card-container bg-surface p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary font-title">
              {impuesto.nombre}
            </h1>
            <p className="text-xs text-text-muted mt-0.5">
              Periodicidad:{" "}
              <span className="font-semibold text-text-main uppercase">
                {impuesto.periodicidad}
              </span>{" "}
              | Regla: {impuesto.regla_vencimiento.replace(/_/g, " ")}
            </p>
          </div>
        </div>
        <div className="text-right text-xs md:border-l md:border-gray-100 md:pl-6 flex flex-col justify-center">
          <span className="text-text-muted">Especialista a Cargo:</span>
          <span className="font-semibold text-primary text-sm mt-0.5">
            {impuesto.usuarios?.nombre_completo || "Sin especialista asignado"}
          </span>
        </div>
      </div>

      <div className="card-container bg-surface p-4 rounded-xl border border-gray-200 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2 text-text-muted text-sm font-medium">
          <Filter className="w-4 h-4" />
          <span>Filtros de Agenda Oficial</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-text-muted uppercase">
              Año Gravable:
            </span>
            <select
              value={anioFiltro}
              onChange={(e) => {
                setAnioFiltro(Number(e.target.value));
              }}
              className="border border-gray-200 rounded-md px-3 py-1.5 text-xs bg-surface outline-none focus:ring-1 focus:ring-accent font-medium text-text-main"
            >
              {[2024, 2025, 2026, 2027].map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-text-muted uppercase">
              Periodo Fiscal:
            </span>
            <select
              value={periodoFiltro}
              onChange={(e) => handlePeriodoChange(e.target.value)}
              className="border border-gray-200 rounded-md px-3 py-1.5 text-xs bg-surface outline-none focus:ring-1 focus:ring-accent font-medium text-text-main"
            >
              <option value="TODOS">Todos los periodos</option>
              {periodosDisponibles.map((p) => (
                <option key={p} value={p}>
                  Periodo {p}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card-container !p-0 overflow-hidden bg-surface border border-gray-200 rounded-xl shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 text-text-muted text-xs uppercase tracking-wider border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-semibold">Periodo</th>
              <th className="px-6 py-4 font-semibold text-center">
                Último Dígito NIT
              </th>
              <th className="px-6 py-4 font-semibold">Fecha Límite Oficial</th>
              {puedeAdministrar && (
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {loading ? (
              <tr>
                <td
                  colSpan={puedeAdministrar ? 4 : 3}
                  className="px-6 py-12 text-center text-text-muted font-mono text-xs uppercase animate-pulse"
                >
                  Consultando matriz de vencimientos...
                </td>
              </tr>
            ) : fechasPaginadas.length === 0 ? (
              <tr>
                <td
                  colSpan={puedeAdministrar ? 4 : 3}
                  className="px-6 py-12 text-center text-text-muted italic text-xs"
                >
                  No se registran fechas base parametrizadas para este periodo.
                </td>
              </tr>
            ) : (
              fechasPaginadas.map((f) => (
                <tr
                  key={f.id}
                  className="hover:bg-gray-50/40 transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className="font-bold text-primary font-mono bg-primary/5 px-2 py-1 rounded text-xs">
                      {f.periodo}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="data-code font-semibold px-2 py-0.5 rounded text-xs">
                      {f.digito !== null
                        ? `Termina en: ${f.digito}`
                        : "Todos (Fecha Fija)"}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-text-main">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-text-muted stroke-[1.5]" />
                      {new Date(
                        f.fecha_vencimiento_oficial + "T12:00:00",
                      ).toLocaleDateString("es-CO", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                  </td>
                  {puedeAdministrar && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setFechaEditando(f);
                            setShowForm(true);
                          }}
                          className="text-text-muted hover:text-accent p-1.5 transition-colors"
                          title="Editar fecha oficial"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteFecha(f.id)}
                          className="text-text-muted hover:text-danger p-1.5 transition-colors"
                          title="Eliminar fecha base"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>

        {!loading && totalRegistros > 0 && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-xs text-text-muted font-medium">
              Mostrando{" "}
              <span className="font-semibold text-text-main">
                {indiceInicial + 1}
              </span>{" "}
              al{" "}
              <span className="font-semibold text-text-main">
                {Math.min(indiceFinal, totalRegistros)}
              </span>{" "}
              de{" "}
              <span className="font-semibold text-text-main">
                {totalRegistros}
              </span>{" "}
              fechas base
            </div>

            {totalPaginas > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setPaginaActual((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={paginaActual === 1}
                  className="p-1.5 rounded-md border border-gray-200 bg-white text-text-muted hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="text-xs font-semibold text-text-main px-2">
                  Página {paginaActual} de {totalPaginas}
                </span>

                <button
                  onClick={() =>
                    setPaginaActual((prev) => Math.min(prev + 1, totalPaginas))
                  }
                  disabled={paginaActual === totalPaginas}
                  className="p-1.5 rounded-md border border-gray-200 bg-white text-text-muted hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showForm && (
        <CalendarioBaseForm
          fechaAEditar={fechaEditando}
          impuestoId={id!}
          onClose={() => {
            setShowForm(false);
            setFechaEditando(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setFechaEditando(null);
            cargarCalendarioBase();
          }}
        />
      )}

      {showBulkForm && (
        <CalendarioCargaMasiva
          impuestoId={id!}
          onClose={() => setShowBulkForm(false)}
          onSuccess={() => {
            setShowBulkForm(false);
            cargarCalendarioBase();
          }}
        />
      )}
    </div>
  );
};
