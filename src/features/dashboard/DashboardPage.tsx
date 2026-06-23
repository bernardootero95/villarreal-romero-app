import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { dashboardService } from "./dashboardService";
import {
  vencimientosService,
  type Vencimiento,
} from "../calendario/vencimientosService";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  CalendarDays,
  AlertCircle,
} from "lucide-react";

interface MetricasDashboard {
  totalClientes: number;
  totalVencimientos: number;
  tareasPendientes: number;
  porcentajeEfectividad: number;
}

interface DiaSemana {
  nombre: string;
  fechaStr: string; // Formato AAAA-MM-DD para emparejar
  numeroDia: number;
  esHoy: boolean;
}

export const DashboardPage = () => {
  const { perfil, session } = useAuth();
  const [metricas, setMetricas] = useState<MetricasDashboard | null>(null);
  const [vencimientosSemana, setVencimientosSemana] = useState<Vencimiento[]>(
    [],
  );
  const [diasSemana, setDiasSemana] = useState<DiaSemana[]>([]);
  const [loading, setLoading] = useState(true);

  // Calcular de forma matemática y estricta los días de la semana actual (Lunes a Viernes)
  const calcularSemanaActual = () => {
    const hoy = new Date();
    const diaActual = hoy.getDay();
    // Ajustar para que la semana empiece el Lunes (1) en lugar de Domingo (0)
    const distanciaAlLunes = diaActual === 0 ? -6 : 1 - diaActual;

    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() + distanciaAlLunes);

    const nombresDias = ["Lun", "Mar", "Mié", "Jue", "Vie"];
    const semana: DiaSemana[] = [];

    for (let i = 0; i < 5; i++) {
      const diaParaCalcular = new Date(lunes);
      diaParaCalcular.setDate(lunes.getDate() + i);

      // Formatear a formato local ISO plano (AAAA-MM-DD) mitigando desajustes horários
      const anio = diaParaCalcular.getFullYear();
      const mes = String(diaParaCalcular.getMonth() + 1).padStart(2, "0");
      const dia = String(diaParaCalcular.getDate()).padStart(2, "0");
      const fechaStr = `${anio}-${mes}-${dia}`;

      semana.push({
        nombre: nombresDias[i],
        fechaStr,
        numeroDia: diaParaCalcular.getDate(),
        esHoy: hoy.toDateString() === diaParaCalcular.toDateString(),
      });
    }
    setDiasSemana(semana);
  };

  useEffect(() => {
    calcularSemanaActual();
  }, []);

  useEffect(() => {
    const cargarDatosDashboard = async () => {
      if (!perfil || !session?.user?.id) return;
      try {
        setLoading(true);
        const hoy = new Date();

        // 1. Obtener métricas core concurrentes
        const dataMetricas = await dashboardService.getMetricasContador(
          session.user.id,
          perfil.cargo,
        );
        setMetricas(dataMetricas);

        // 2. Obtener los vencimientos oficiales vigentes del mes para el cruce de la agenda semanal
        const dataVencimientos = await vencimientosService.getVencimientosMes(
          hoy.getFullYear(),
          hoy.getMonth(),
          session.user.id,
          perfil.cargo,
        );
        setVencimientosSemana(dataVencimientos);
      } catch (error) {
        console.error(
          "Error al sincronizar datos de control en Dashboard:",
          error,
        );
      } finally {
        setLoading(false);
      }
    };

    cargarDatosDashboard();
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

      {/* ÁREA COHESIVA DE TRABAJO DIARIO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna de Alertas Críticas (2/3 de pantalla) */}
        <div className="lg:col-span-2 border border-dashed border-gray-200 rounded-xl bg-gray-50 p-8 text-center flex flex-col items-center justify-center min-h-[240px]">
          <p className="text-sm font-semibold text-text-main">
            Próxima sección: Alertas críticas de vencimiento
          </p>
          <p className="text-xs text-text-muted max-w-sm mt-1">
            Aquí listaremos de forma cronológica las 5 tareas más próximas a
            vencer para actuar de inmediato.
          </p>
        </div>

        {/* COMPONENTE NUEVO: Mini-Calendario Operativo Semanal (1/3 de pantalla) */}
        <div className="card-container bg-surface p-5 rounded-xl border border-gray-200 shadow-2xs flex flex-col space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <CalendarDays className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-title font-bold text-primary uppercase tracking-wide">
              Agenda Semanal de Trabajo
            </h3>
          </div>

          {/* Grid de 5 Columnas, una por cada día laboral */}
          <div className="grid grid-cols-5 gap-1 bg-gray-50 p-1.5 rounded-lg border border-gray-100">
            {diasSemana.map((dia) => {
              // Filtrar cuántas tareas de la firma coinciden con la fecha exacta de este casillero
              const tareasDelDia = vencimientosSemana.filter(
                (v) => v.fecha_limite === dia.fechaStr,
              );

              const pendientesDelDia = tareasDelDia.filter(
                (t) => t.estado_tarea !== "PRESENTADO",
              ).length;

              return (
                <div
                  key={dia.fechaStr}
                  className={`flex flex-col items-center p-1.5 rounded-md transition-all ${
                    dia.esHoy
                      ? "bg-primary text-surface shadow-xs scale-105"
                      : "hover:bg-gray-200/50"
                  }`}
                  title={`${tareasDelDia.length} obligaciones fijadas para este día`}
                >
                  <span
                    className={`text-[10px] uppercase font-bold ${dia.esHoy ? "text-accent" : "text-text-muted"}`}
                  >
                    {dia.nombre}
                  </span>
                  <span className="text-sm font-bold font-title mt-0.5">
                    {dia.numeroDia}
                  </span>

                  {/* Indicador de carga operativa del día mediante badges de color */}
                  <div className="mt-1.5 flex gap-0.5 justify-center min-h-[6px]">
                    {tareasDelDia.length > 0 ? (
                      <span
                        className={`w-2 h-2 rounded-full ${pendientesDelDia > 0 ? "bg-amber-500 animate-pulse" : "bg-success"}`}
                      />
                    ) : (
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Lista detallada rápida de vencimientos HOY */}
          <div className="flex-1 overflow-y-auto max-h-[160px] space-y-2 pr-1">
            {(() => {
              const hoyStr = diasSemana.find((d) => d.esHoy)?.fechaStr;
              const tareasHoy = vencimientosSemana.filter(
                (v) => v.fecha_limite === hoyStr,
              );

              if (tareasHoy.length === 0) {
                return (
                  <div className="text-center py-6 text-text-muted space-y-1">
                    <AlertCircle className="w-5 h-5 text-text-muted/50 mx-auto" />
                    <p className="text-[11px] font-medium">
                      No registras vencimientos para hoy.
                    </p>
                  </div>
                );
              }

              return tareasHoy.map((t) => (
                <div
                  key={t.id}
                  className="p-2 bg-gray-50 border border-gray-100 rounded-md flex justify-between items-center text-[11px]"
                >
                  <div className="truncate space-y-0.5 max-w-[70%]">
                    <p className="font-bold text-primary truncate">
                      {t.clientes.razon_social}
                    </p>
                    <p className="text-text-muted truncate">
                      {t.impuestos.nombre}
                    </p>
                  </div>
                  <span
                    className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase ${
                      t.estado_tarea === "PRESENTADO"
                        ? "bg-success/10 text-success border-success/20"
                        : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                    }`}
                  >
                    {t.estado_tarea}
                  </span>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};
