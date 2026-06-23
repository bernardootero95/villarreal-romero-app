import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Filter,
  AlertCircle,
  CalendarDays,
  Hash,
} from "lucide-react";
import { impuestosService } from "./impuestosService";
import { calendarioBaseService } from "../calendario-base/calendarioBaseService";
import type { ImpuestoConEspecialista } from "./types";
import type { CalendarioBaseConImpuesto } from "../calendario-base/types";

export const DetalleImpuestoPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [impuesto, setImpuesto] = useState<ImpuestoConEspecialista | null>(
    null,
  );
  const [fechasBase, setFechasBase] = useState<CalendarioBaseConImpuesto[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de Filtro Solicitados
  const [anioFiltro, setAnioFiltro] = useState(new Date().getFullYear());
  const [periodoFiltro, setPeriodoFiltro] = useState<string>("TODOS");

  // 1. Cargar metadatos del impuesto
  useEffect(() => {
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
    cargarImpuesto();
  }, [id]);

  // 2. Cargar Matriz del Calendario Base según el Año seleccionado
  useEffect(() => {
    const cargarCalendarioBase = async () => {
      try {
        setLoading(true);
        // Consumimos tu servicio existente de forma limpia
        const data = await calendarioBaseService.getAll(anioFiltro);
        // Filtramos en primera instancia para que solo correspondan a este impuesto
        const filtradasPorImpuesto = data.filter((f) => f.impuesto_id === id);
        setFechasBase(filtradasPorImpuesto);
      } catch (error) {
        console.error("Error cargando matriz de fechas oficiales:", error);
      } finally {
        setLoading(false);
      }
    };
    cargarCalendarioBase();
  }, [id, anioFiltro]);

  // Extraer periodos únicos existentes en la matriz para alimentar dinámicamente el selector de periodos
  const periodosDisponibles = Array.from(
    new Set(fechasBase.map((f) => f.periodo)),
  ).sort();

  // 3. Filtrado reactivo en memoria por Periodo
  const fechasFiltradas = fechasBase.filter((f) => {
    if (periodoFiltro === "TODOS") return true;
    return f.periodo === periodoFiltro;
  });

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
      <button
        onClick={() => navigate("/impuestos")}
        className="flex items-center gap-2 text-sm font-medium text-text-muted hover:text-primary transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Volver al Catálogo
      </button>

      {/* Encabezado Principal */}
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

      {/* Barra Controladora de Filtros (Año y Periodo) */}
      <div className="card-container bg-surface p-4 rounded-xl border border-gray-200 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2 text-text-muted text-sm font-medium">
          <Filter className="w-4 h-4" />
          <span>Filtros de Agenda Oficial</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Selector de Año Gravable */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-text-muted uppercase">
              Año Gravable:
            </span>
            <select
              value={anioFiltro}
              onChange={(e) => {
                setAnioFiltro(Number(e.target.value));
                setPeriodoFiltro("TODOS"); // Reseteamos periodo al mutar año
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

          {/* Selector de Periodo */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-text-muted uppercase">
              Periodo Fiscal:
            </span>
            <select
              value={periodoFiltro}
              onChange={(e) => setPeriodoFiltro(e.target.value)}
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

      {/* Tabla de Vencimientos Oficiales Filtrados */}
      <div className="card-container !p-0 overflow-hidden bg-surface border border-gray-200 rounded-xl shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 text-text-muted text-xs uppercase tracking-wider border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-semibold">Periodo</th>
              <th className="px-6 py-4 font-semibold text-center">
                Último Dígito NIT
              </th>
              <th className="px-6 py-4 font-semibold">
                Fecha Límite Decreto Oficial
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {loading ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-6 py-12 text-center text-text-muted font-mono text-xs uppercase animate-pulse"
                >
                  Consultando matriz de vencimientos...
                </td>
              </tr>
            ) : fechasFiltradas.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-6 py-12 text-center text-text-muted italic text-xs"
                >
                  No se registran fechas base parametrizadas para el Año{" "}
                  {anioFiltro} y Periodo {periodoFiltro}.
                </td>
              </tr>
            ) : (
              fechasFiltradas.map((f) => (
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
