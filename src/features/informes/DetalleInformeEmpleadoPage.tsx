import { useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useDetalleInformeEmpleado } from "./useInformes";
import { exportService } from "./exportService";
import type { ClasificacionVencimiento } from "./types";
import {
  ArrowLeft,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  AlertTriangle,
  FileText,
  Search,
} from "lucide-react";
import { Loader } from "../../components/Loader";

export const DetalleInformeEmpleadoPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const hoy = new Date();
  const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  const fechaInicio = searchParams.get("fechaInicio") || primerDiaMes;
  const fechaFin = searchParams.get("fechaFin") || ultimoDiaMes;

  const [filtroClasificacion, setFiltroClasificacion] =
    useState<string>("TODOS");
  const [busquedaTexto, setBusquedaTexto] = useState<string>("");

  const {
    data: resumen,
    isLoading,
    error,
  } = useDetalleInformeEmpleado(id, fechaInicio, fechaFin);

  if (isLoading) {
    return (
      <Loader
        texto="Cargando auditoría detallada del especialista..."
        fullScreen={false}
      />
    );
  }

  if (error || !resumen) {
    return (
      <div className="bg-surface p-8 rounded-xl border border-danger/30 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-danger mx-auto" />
        <h2 className="text-lg font-bold text-primary">
          No fue posible recuperar la información
        </h2>
        <p className="text-text-muted text-sm">
          El registro del empleado no existe o hubo un error en la conexión.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="bg-primary text-surface px-4 py-2 rounded-md text-xs font-semibold hover:bg-primary/90 transition-all cursor-pointer"
        >
          Volver a Informes
        </button>
      </div>
    );
  }

  const { usuario, metricas, items } = resumen;

  const itemsFiltrados = items.filter((item) => {
    const coincideClase =
      filtroClasificacion === "TODOS" ||
      item.clasificacion === filtroClasificacion;
    const coincideTexto =
      item.razon_social.toLowerCase().includes(busquedaTexto.toLowerCase()) ||
      item.nit.includes(busquedaTexto) ||
      item.impuesto_nombre.toLowerCase().includes(busquedaTexto.toLowerCase());
    return coincideClase && coincideTexto;
  });

  const handleExportar = () => {
    exportService.exportarDetalleEmpleadoExcel(
      itemsFiltrados,
      usuario.nombre_completo,
      fechaInicio,
      fechaFin,
    );
  };

  const renderBadgeClasificacion = (clase: ClasificacionVencimiento) => {
    switch (clase) {
      case "A_TIEMPO":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-success/10 text-success border border-success/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> A Tiempo
          </span>
        );
      case "TARDE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-extrabold font-mono bg-warning/10 text-warning border border-warning/20">
            <AlertCircle className="w-3.5 h-3.5" /> Tarde
          </span>
        );
      case "VENCIDO":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-extrabold font-mono bg-danger text-surface border border-danger animate-pulse shadow-xs">
            <AlertTriangle className="w-3.5 h-3.5" /> Vencido
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold font-mono bg-primary/5 text-primary border border-primary/10">
            <Clock className="w-3.5 h-3.5" /> Pendiente
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-text-muted/10 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-primary/5 rounded-lg text-primary transition-colors cursor-pointer"
            title="Regresar a la vista general"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-title font-bold text-primary flex items-center gap-2">
              {usuario.nombre_completo}
            </h1>
            <p className="text-text-muted text-xs font-mono">
              Cargo:{" "}
              <span className="text-primary font-semibold">
                {usuario.cargo}
              </span>{" "}
              | Período evaluado:{" "}
              <span className="text-primary font-semibold">
                {fechaInicio} al {fechaFin}
              </span>
            </p>
          </div>
        </div>

        <button
          onClick={handleExportar}
          disabled={itemsFiltrados.length === 0}
          className="bg-accent hover:bg-accent/90 text-primary font-semibold px-4 py-2 rounded-md text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
        >
          <Download className="w-4 h-4" />
          Descargar Auditoría Excel
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-surface p-4 rounded-xl border border-text-muted/20 shadow-xs text-center">
          <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
            Total Asignado
          </p>
          <p className="text-2xl font-title font-bold text-primary mt-1 font-mono">
            {metricas.total}
          </p>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-success/30 bg-success/5 shadow-xs text-center">
          <p className="text-[11px] font-bold text-success uppercase tracking-wider">
            A Tiempo
          </p>
          <p className="text-2xl font-title font-bold text-success mt-1 font-mono">
            {metricas.a_tiempo}
          </p>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-warning/30 bg-warning/5 shadow-xs text-center">
          <p className="text-[11px] font-bold text-warning uppercase tracking-wider">
            Tarde
          </p>
          <p className="text-2xl font-title font-bold text-warning mt-1 font-mono">
            {metricas.tarde}
          </p>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-primary/20 bg-primary/5 shadow-xs text-center">
          <p className="text-[11px] font-bold text-primary uppercase tracking-wider">
            Pendientes
          </p>
          <p className="text-2xl font-title font-bold text-primary mt-1 font-mono">
            {metricas.pendientes}
          </p>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-danger/30 bg-danger/5 shadow-xs text-center">
          <p className="text-[11px] font-bold text-danger uppercase tracking-wider">
            Vencidos
          </p>
          <p className="text-2xl font-title font-bold text-danger mt-1 font-mono">
            {metricas.vencidos}
          </p>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-text-muted/20 shadow-xs text-center flex flex-col justify-center">
          <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
            Efectividad
          </p>
          <p className="text-2xl font-title font-bold text-primary mt-1 font-mono">
            {metricas.efectividad}%
          </p>
        </div>
      </div>

      <div className="bg-surface border border-text-muted/20 rounded-xl shadow-xs overflow-hidden space-y-4 p-4">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 border-b border-text-muted/10 pb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por cliente, NIT u obligación..."
              value={busquedaTexto}
              onChange={(e) => setBusquedaTexto(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 border border-text-muted/30 rounded-md bg-background text-xs outline-none focus:ring-1 focus:ring-accent transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "TODOS", label: "Todos" },
              { id: "A_TIEMPO", label: "A Tiempo" },
              { id: "TARDE", label: "Tarde" },
              { id: "PENDIENTE", label: "Pendientes" },
              { id: "VENCIDO", label: "Vencidos" },
            ].map((opcion) => (
              <button
                key={opcion.id}
                onClick={() => setFiltroClasificacion(opcion.id)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  filtroClasificacion === opcion.id
                    ? "bg-primary text-surface shadow-xs"
                    : "bg-background text-text-muted hover:text-primary border border-text-muted/20"
                }`}
              >
                {opcion.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-background/50 text-text-muted text-xs uppercase tracking-wider border-b border-text-muted/10">
                <th className="px-4 py-3 font-semibold">Cliente / NIT</th>
                <th className="px-4 py-3 font-semibold">
                  Obligación Tributaria
                </th>
                <th className="px-4 py-3 font-semibold text-center">
                  Límite DIAN
                </th>
                <th className="px-4 py-3 font-semibold text-center">
                  Radicación
                </th>
                <th className="px-4 py-3 font-semibold text-center">Estado</th>
                <th className="px-4 py-3 font-semibold">
                  Observaciones / Radicado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-text-muted/10">
              {itemsFiltrados.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-text-muted italic text-xs"
                  >
                    No se encontraron obligaciones que coincidan con los filtros
                    aplicados.
                  </td>
                </tr>
              ) : (
                itemsFiltrados.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-primary/5 transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-primary">
                        {item.razon_social}
                      </div>
                      <div className="text-[11px] text-text-muted font-mono">
                        NIT: {item.nit}-{item.dv}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-primary">
                        {item.impuesto_nombre}
                      </div>
                      <div className="text-[11px] text-text-muted font-mono">
                        Período: {item.periodo_fiscal}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono font-bold text-primary text-xs">
                      {item.fecha_limite}
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono text-xs text-text-muted">
                      {item.fecha_radicacion || "Pendiente"}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {renderBadgeClasificacion(item.clasificacion)}
                    </td>
                    <td className="px-4 py-3.5">
                      {item.observaciones ? (
                        <div className="flex items-start gap-1.5 text-xs text-primary bg-primary/5 p-2 rounded border border-primary/10 max-w-xs">
                          <FileText className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                          <span className="font-mono break-all">
                            {item.observaciones}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-text-muted italic">
                          Sin observaciones
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
