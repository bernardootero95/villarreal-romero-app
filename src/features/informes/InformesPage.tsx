import { useState } from "react";
import { FiltrosInforme } from "./FiltrosInforme";
import { useInformeCumplimiento, useInformeCargaEquipo } from "./useInformes";
import type { FiltrosInformeData } from "./types";
import {
  FileSpreadsheet,
  TrendingUp,
  Users,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { Loader } from "../../components/Loader";

export const InformesPage = () => {
  const hoy = new Date();
  const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  const [filtros, setFiltros] = useState<FiltrosInformeData>({
    fechaInicio: primerDiaMes,
    fechaFin: ultimoDiaMes,
    clienteId: "",
  });

  const [tabActiva, setTabActiva] = useState<"CLIENTES" | "EQUIPO">("CLIENTES");

  const { data: datosClientes = [], isLoading: loadingClientes } =
    useInformeCumplimiento(filtros);

  const { data: datosEquipo = [], isLoading: loadingEquipo } =
    useInformeCargaEquipo(filtros);

  const isLoading = loadingClientes || loadingEquipo;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-title font-bold text-primary flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-accent" />
            Centro de Informes
          </h1>
          <p className="text-text-muted text-sm">
            Auditoría de cumplimiento tributario y rendimiento operativo de la
            firma.
          </p>
        </div>

        <div className="flex bg-surface border border-text-muted/20 p-1 rounded-lg shadow-xs">
          <button
            onClick={() => setTabActiva("CLIENTES")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              tabActiva === "CLIENTES"
                ? "bg-primary text-surface shadow-sm"
                : "text-text-muted hover:text-primary"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Cumplimiento Clientes
          </button>
          <button
            onClick={() => setTabActiva("EQUIPO")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              tabActiva === "EQUIPO"
                ? "bg-primary text-surface shadow-sm"
                : "text-text-muted hover:text-primary"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Carga Operativa
          </button>
        </div>
      </div>

      <FiltrosInforme
        filtrosActuales={filtros}
        onAplicarFiltros={(nuevosFiltros) => setFiltros(nuevosFiltros)}
      />

      {isLoading ? (
        <Loader
          texto="Procesando métricas y consolidando datos..."
          fullScreen={false}
        />
      ) : tabActiva === "CLIENTES" ? (
        <div className="bg-surface border border-text-muted/20 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 bg-background border-b border-text-muted/10 flex justify-between items-center">
            <h3 className="font-title font-bold text-primary text-sm flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-accent" />
              Estado de Obligaciones por Cliente
            </h3>
            <span className="text-xs font-mono text-text-muted">
              Total Registros: {datosClientes.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-background/50 text-text-muted text-xs uppercase tracking-wider border-b border-text-muted/10">
                  <th className="px-6 py-3.5 font-semibold">Cliente</th>
                  <th className="px-6 py-3.5 font-semibold text-center">
                    Total Vtos
                  </th>
                  <th className="px-6 py-3.5 font-semibold text-center text-success">
                    Presentados
                  </th>
                  <th className="px-6 py-3.5 font-semibold text-center text-warning">
                    Pendientes
                  </th>
                  <th className="px-6 py-3.5 font-semibold text-center text-danger">
                    Vencidos
                  </th>
                  <th className="px-6 py-3.5 font-semibold text-right">
                    Cumplimiento
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-text-muted/10">
                {datosClientes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-text-muted italic text-xs"
                    >
                      No se encontraron movimientos tributarios en este rango de
                      fechas.
                    </td>
                  </tr>
                ) : (
                  datosClientes.map((item) => (
                    <tr
                      key={item.cliente_id}
                      className="hover:bg-primary/5 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-primary">
                          {item.razon_social}
                        </div>
                        <div className="text-xs text-text-muted font-mono">
                          NIT: {item.nit}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-primary">
                        {item.total_vencimientos}
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-success bg-success/5">
                        {item.presentados}
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-warning bg-warning/5">
                        {item.pendientes}
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-danger bg-danger/5">
                        {item.vencidos}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-text-muted/20 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-success h-full transition-all duration-300"
                              style={{
                                width: `${item.porcentaje_cumplimiento}%`,
                              }}
                            />
                          </div>
                          <span className="font-mono font-bold text-xs text-primary w-9 text-right">
                            {item.porcentaje_cumplimiento}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-surface border border-text-muted/20 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 bg-background border-b border-text-muted/10 flex justify-between items-center">
            <h3 className="font-title font-bold text-primary text-sm flex items-center gap-1.5">
              <Users className="w-4 h-4 text-accent" />
              Rendimiento Operativo por Especialista
            </h3>
            <span className="text-xs font-mono text-text-muted">
              Miembros Activos: {datosEquipo.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-background/50 text-text-muted text-xs uppercase tracking-wider border-b border-text-muted/10">
                  <th className="px-6 py-3.5 font-semibold">
                    Miembro del Equipo
                  </th>
                  <th className="px-6 py-3.5 font-semibold text-center">
                    Cargo
                  </th>
                  <th className="px-6 py-3.5 font-semibold text-center text-success flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> T. Listas
                  </th>
                  <th className="px-6 py-3.5 font-semibold text-center text-warning">
                    <Clock className="w-3.5 h-3.5 inline mr-1" /> T. Pendientes
                  </th>
                  <th className="px-6 py-3.5 font-semibold text-center text-danger">
                    <AlertTriangle className="w-3.5 h-3.5 inline mr-1" /> T.
                    Vencidas
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-text-muted/10">
                {datosEquipo.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-text-muted italic text-xs"
                    >
                      No hay registros de tareas para los miembros activos.
                    </td>
                  </tr>
                ) : (
                  datosEquipo.map((miembro) => (
                    <tr
                      key={miembro.usuario_id}
                      className="hover:bg-primary/5 transition-colors"
                    >
                      <td className="px-6 py-4 font-semibold text-primary">
                        {miembro.nombre_completo}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-0.5 bg-primary/5 text-primary text-xs font-medium rounded-full border border-primary/10">
                          {miembro.cargo}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-success bg-success/5">
                        {miembro.tareas_completadas}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-warning bg-warning/5">
                        {miembro.tareas_pendientes}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-danger bg-danger/5">
                        {miembro.tareas_vencidas}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
