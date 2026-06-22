import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { dashboardService } from "./dashboardService";
import { Building2, Calendar, CheckCircle2, Clock } from "lucide-react";

interface MetricasDashboard {
  totalClientes: number;
  totalVencimientos: number;
  tareasPendientes: number;
  porcentajeEfectividad: number;
}

export const DashboardPage = () => {
  const { perfil, session } = useAuth();
  const [metricas, setMetricas] = useState<MetricasDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarMetricas = async () => {
      if (!perfil || !session?.user?.id) return;
      try {
        setLoading(true);
        const data = await dashboardService.getMetricasContador(
          session.user.id,
          perfil.cargo,
        );
        setMetricas(data);
      } catch (error) {
        console.error("Error al sincronizar métricas del dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarMetricas();
  }, [perfil, session]);

  if (loading) {
    return (
      <div className="text-center p-12 text-text-muted text-sm font-semibold font-mono uppercase tracking-wider animate-pulse">
        Sincronizando panel de control contable...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Mensaje de Bienvenida Institucional */}
      <div>
        <h1 className="text-2xl font-title font-bold text-primary">
          Panel de Control Operativo
        </h1>
        <p className="text-text-muted text-sm mt-1">
          Bienvenido de nuevo,{" "}
          <span className="font-semibold text-text-main">
            {perfil?.nombre_completo}
          </span>{" "}
          ({perfil?.cargo}).
        </p>
      </div>

      {/* Grid Responsive de Tarjetas de Métricas Core */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Tarjeta 1: Clientes Asignados */}
        <div className="card-container bg-surface p-5 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Mis Empresas
            </span>
            <p className="text-3xl font-bold text-primary font-title">
              {metricas?.totalClientes}
            </p>
            <p className="text-[11px] text-text-muted">
              Clientes bajo tu cargo
            </p>
          </div>
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Tarjeta 2: Vencimientos del Mes */}
        <div className="card-container bg-surface p-5 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Vencimientos Mes
            </span>
            <p className="text-3xl font-bold text-primary font-title">
              {metricas?.totalVencimientos}
            </p>
            <p className="text-[11px] text-text-muted">
              Obligaciones fiscales totales
            </p>
          </div>
          <div className="w-12 h-12 bg-accent/20 text-primary rounded-xl flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Tarjeta 3: Tareas Pendientes */}
        <div className="card-container bg-surface p-5 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Por Ejecutar
            </span>
            <p className="text-3xl font-bold text-amber-600 font-title">
              {metricas?.tareasPendientes}
            </p>
            <p className="text-[11px] text-text-muted">
              Pendientes y en revisión
            </p>
          </div>
          <div className="w-12 h-12 bg-amber-500/10 text-amber-600 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Tarjeta 4: Porcentaje de Efectividad */}
        <div className="card-container bg-surface p-5 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Cumplimiento
            </span>
            <p className="text-3xl font-bold text-success font-title">
              {metricas?.porcentajeEfectividad}%
            </p>
            <p className="text-[11px] text-text-muted">
              Efectividad de presentación
            </p>
          </div>
          <div className="w-12 h-12 bg-success/10 text-success rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ÁREA EN BLANCO SEGMENTADA PARA PRÓXIMOS LISTADOS O GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border border-dashed border-gray-200 rounded-xl bg-gray-50 p-8 text-center flex flex-col items-center justify-center min-h-[240px]">
          <p className="text-sm font-semibold text-text-main">
            Próxima sección: Alertas críticas de vencimiento
          </p>
          <p className="text-xs text-text-muted max-w-sm mt-1">
            Aquí listaremos de forma cronológica las 5 tareas más próximas a
            vencer para actuar de inmediato.
          </p>
        </div>
        <div className="border border-dashed border-gray-200 rounded-xl bg-gray-50 p-8 text-center flex flex-col items-center justify-center min-h-[240px]">
          <p className="text-sm font-semibold text-text-main">
            Próxima sección: Estado de la firma
          </p>
          <p className="text-xs text-text-muted mt-1">
            Gráfica circular rápida del estado de obligaciones.
          </p>
        </div>
      </div>
    </div>
  );
};
