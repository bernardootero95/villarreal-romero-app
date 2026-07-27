import { useState } from "react";
import { FiltrosInforme } from "./FiltrosInforme";
import { useInformesVencimientos } from "./useInformes";
import type { FiltrosInformeData } from "./types";
import {
  FileSpreadsheet,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  AlertCircle,
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
    usuarioId: "",
  });

  const { data: datosEmpleados = [], isLoading } =
    useInformesVencimientos(filtros);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl font-title font-bold text-primary flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-accent" />
          Rendimiento Operativo por Empleado
        </h1>
        <p className="text-text-muted text-sm">
          Evaluación de efectividad en la presentación oficial de vencimientos
          tributarios asignados.
        </p>
      </div>

      <FiltrosInforme
        filtrosActuales={filtros}
        onAplicarFiltros={(nuevosFiltros) => setFiltros(nuevosFiltros)}
      />

      {isLoading ? (
        <Loader
          texto="Consolidando métricas de cumplimiento por empleado..."
          fullScreen={false}
        />
      ) : (
        <div className="bg-surface border border-text-muted/20 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 bg-background border-b border-text-muted/10 flex justify-between items-center">
            <h3 className="font-title font-bold text-primary text-sm flex items-center gap-1.5">
              <Users className="w-4 h-4 text-accent" />
              Desglose de Vencimientos por Especialista
            </h3>
            <span className="text-xs font-mono text-text-muted">
              Miembros Evaluados: {datosEmpleados.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-background/50 text-text-muted text-xs uppercase tracking-wider border-b border-text-muted/10">
                  <th className="px-6 py-3.5 font-semibold">Empleado</th>
                  <th className="px-6 py-3.5 font-semibold text-center">
                    Total Asignado
                  </th>
                  <th className="px-6 py-3.5 font-semibold text-center text-success">
                    <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" /> A
                    Tiempo
                  </th>
                  <th className="px-6 py-3.5 font-semibold text-center text-warning">
                    <AlertCircle className="w-3.5 h-3.5 inline mr-1" /> Tarde
                  </th>
                  <th className="px-6 py-3.5 font-semibold text-center text-primary">
                    <Clock className="w-3.5 h-3.5 inline mr-1" /> Pendientes
                  </th>
                  <th className="px-6 py-3.5 font-semibold text-center text-danger">
                    <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />{" "}
                    Vencidos
                  </th>
                  <th className="px-6 py-3.5 font-semibold text-right">
                    Efectividad
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-text-muted/10">
                {datosEmpleados.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-text-muted italic text-xs"
                    >
                      No se encontraron registros en el período seleccionado.
                    </td>
                  </tr>
                ) : (
                  datosEmpleados.map((emp) => (
                    <tr
                      key={emp.usuario_id}
                      className="hover:bg-primary/5 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-primary">
                          {emp.nombre_completo}
                        </div>
                        <span className="px-2 py-0.5 mt-1 inline-block bg-primary/5 text-primary text-[11px] font-medium rounded-full border border-primary/10">
                          {emp.cargo}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center font-bold text-primary font-mono text-base">
                        {emp.total_vencimientos}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-success bg-success/10 px-2.5 py-1 rounded-md font-mono text-xs border border-success/20">
                          {emp.presentados_a_tiempo}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span
                          className={`font-bold px-2.5 py-1 rounded-md font-mono text-xs border ${
                            emp.presentados_tarde > 0
                              ? "bg-warning/10 text-warning border-warning/20 font-extrabold"
                              : "bg-background text-text-muted border-text-muted/20"
                          }`}
                        >
                          {emp.presentados_tarde}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="font-semibold text-primary bg-primary/5 px-2.5 py-1 rounded-md font-mono text-xs border border-primary/10">
                          {emp.pendientes}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span
                          className={`font-bold px-2.5 py-1 rounded-md font-mono text-xs border ${
                            emp.vencidos > 0
                              ? "bg-danger text-surface border-danger animate-pulse shadow-xs"
                              : "bg-background text-text-muted border-text-muted/20"
                          }`}
                        >
                          {emp.vencidos}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-text-muted/20 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                emp.porcentaje_efectividad >= 80
                                  ? "bg-success"
                                  : emp.porcentaje_efectividad >= 50
                                    ? "bg-warning"
                                    : "bg-danger"
                              }`}
                              style={{
                                width: `${emp.porcentaje_efectividad}%`,
                              }}
                            />
                          </div>
                          <span className="font-mono font-bold text-xs text-primary w-10 text-right">
                            {emp.porcentaje_efectividad}%
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
      )}
    </div>
  );
};
