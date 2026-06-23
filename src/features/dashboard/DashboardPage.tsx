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
  AlertTriangle,
  ChevronRight,
  Flame,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export const DashboardPage = () => {
  const { perfil, session } = useAuth();
  const navigate = useNavigate();
  const [metricas, setMetricas] = useState<any>(null);
  const [vencimientosSemana, setVencimientosSemana] = useState<Vencimiento[]>(
    [],
  );
  const [diasSemana, setDiasSemana] = useState<any[]>([]);
  const [diaSeleccionado, setDiaSeleccionado] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const calcularSemanaActual = () => {
    const hoy = new Date();
    const diaActual = hoy.getDay();
    const distanciaAlLunes = diaActual === 0 ? -6 : 1 - diaActual;

    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() + distanciaAlLunes);

    const nombresDias = ["Lun", "Mar", "Mié", "Jue", "Vie"];
    const semana: any[] = [];
    let banderaDiaSeleccionado = "";

    for (let i = 0; i < 5; i++) {
      const diaParaCalcular = new Date(lunes);
      diaParaCalcular.setDate(lunes.getDate() + i);

      const anio = diaParaCalcular.getFullYear();
      const mes = String(diaParaCalcular.getMonth() + 1).padStart(2, "0");
      const dia = String(diaParaCalcular.getDate()).padStart(2, "0");
      const fechaStr = `${anio}-${mes}-${dia}`;

      const esHoy = hoy.toDateString() === diaParaCalcular.toDateString();
      if (esHoy) banderaDiaSeleccionado = fechaStr;

      semana.push({
        nombre: nombresDias[i],
        fechaStr,
        numeroDia: diaParaCalcular.getDate(),
        esHoy,
      });
    }

    setDiasSemana(semana);
    setDiaSeleccionado(banderaDiaSeleccionado || semana[0].fechaStr);
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

        const dataMetricas = await dashboardService.getMetricasContador(
          session.user.id,
          perfil.cargo,
        );
        setMetricas(dataMetricas);

        const dataVencimientos = await vencimientosService.getVencimientosMes(
          hoy.getFullYear(),
          hoy.getMonth(),
          session.user.id,
          perfil.cargo,
        );
        setVencimientosSemana(dataVencimientos);
      } catch (error) {
        console.error("Error al sincronizar datos:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatosDashboard();
  }, [perfil, session]);

  const tareasDiaSeleccionado = vencimientosSemana.filter(
    (v) => v.fecha_limite === diaSeleccionado,
  );
  const infoDiaSeleccionado = diasSemana.find(
    (d) => d.fechaStr === diaSeleccionado,
  );

  if (loading) {
    return (
      <div className="text-center p-12 text-text-muted text-sm font-semibold font-mono uppercase tracking-wider animate-pulse">
        Sincronizando panel de control contable...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Mensaje de Bienvenida */}
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

      {/* Grid de Tarjetas Core */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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

        <div className="card-container bg-surface p-5 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Vencimientos Mes
            </span>
            <p className="text-3xl font-bold text-primary font-title">
              {metricas?.totalVencimientos}
            </p>
            <p className="text-[11px] text-text-muted">
              Obligaciones totales del periodo
            </p>
          </div>
          <div className="w-12 h-12 bg-accent/20 text-primary rounded-xl flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

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

      {/* ÁREA COHESIVA CENTRAL DEL DASHBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* BLOQUE IZQUIERDO: ALERTAS Y COMPORTAMIENTO (2/3 de la pantalla) */}
        <div className="lg:col-span-2 space-y-6">
          {/* SECCIÓN 1: Alertas Críticas */}
          <div className="card-container bg-surface p-6 rounded-xl border border-gray-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 text-danger border-b border-gray-100 pb-3">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-title font-bold uppercase tracking-wide">
                Alertas Críticas de Vencimiento (Próximos 5 días)
              </h3>
            </div>

            <div className="divide-y divide-gray-100">
              {metricas?.alertasCriticas.length === 0 ? (
                <div className="text-center py-8 text-text-muted space-y-1">
                  <CheckCircle2 className="w-8 h-8 text-success/60 mx-auto" />
                  <p className="text-xs font-medium text-text-main">
                    ¡Agenda al día!
                  </p>
                  <p className="text-[11px]">
                    No tienes obligaciones críticas venciendo esta semana.
                  </p>
                </div>
              ) : (
                metricas?.alertasCriticas.map((alerta: any) => (
                  <div
                    key={alerta.id}
                    onClick={() => navigate(`/clientes/${alerta.clientes.id}`)}
                    className="py-3 flex justify-between items-center hover:bg-gray-50/60 px-2 rounded-lg cursor-pointer transition-colors group"
                  >
                    <div className="space-y-0.5 max-w-[70%]">
                      <p className="text-xs font-bold text-primary group-hover:text-accent transition-colors truncate">
                        {alerta.clientes.razon_social}
                      </p>
                      <p className="text-[11px] text-text-muted truncate">
                        {alerta.impuestos.nombre} (Per: {alerta.periodo_fiscal})
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <span className="text-[11px] font-mono bg-danger/10 text-danger px-2 py-0.5 rounded border border-danger/20 font-bold">
                        Vence:{" "}
                        {new Date(alerta.fecha_limite).toLocaleDateString(
                          "es-CO",
                          { day: "2-digit", month: "short", timeZone: "UTC" },
                        )}
                      </span>
                      <ChevronRight className="w-4 h-4 text-text-muted group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SECCIÓN 2: Top Clientes en Riesgo Operativo */}
          <div className="card-container bg-surface p-6 rounded-xl border border-gray-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 text-primary border-b border-gray-100 pb-3">
              <Flame className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-title font-bold uppercase tracking-wide">
                Top 5 Clientes con Mayor Carga Pendiente
              </h3>
            </div>

            {metricas?.topClientesCarga.length === 0 ? (
              <p className="text-xs text-text-muted italic py-4 text-center">
                Firma sin pendientes acumulados.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {metricas?.topClientesCarga.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 bg-gray-50 border border-gray-100 rounded-lg flex justify-between items-center"
                  >
                    <span className="text-xs font-semibold text-text-main truncate max-w-[75%]">
                      {item.nombre}
                    </span>
                    <span className="text-xs font-mono font-bold bg-amber-500/10 text-amber-700 px-2 py-0.5 rounded border border-amber-500/20">
                      {item.pendientes} tgs
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* COMPONENTE: Mini-Calendario Operativo Semanal (1/3 de la pantalla) */}
        <div className="card-container bg-surface p-5 rounded-xl border border-gray-200 shadow-2xs flex flex-col space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <CalendarDays className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-title font-bold text-primary uppercase tracking-wide">
              Agenda Semanal de Trabajo
            </h3>
          </div>

          <div className="grid grid-cols-5 gap-1 bg-gray-50 p-1.5 rounded-lg border border-gray-100">
            {diasSemana.map((dia) => {
              const tareasDelDia = vencimientosSemana.filter(
                (v) => v.fecha_limite === dia.fechaStr,
              );
              const pendientesDelDia = tareasDelDia.filter(
                (t) => t.estado_tarea !== "PRESENTADO",
              ).length;
              const esSeleccionado = dia.fechaStr === diaSeleccionado;

              return (
                <button
                  key={dia.fechaStr}
                  onClick={() => setDiaSeleccionado(dia.fechaStr)}
                  className={`flex flex-col items-center p-1.5 rounded-md transition-all outline-none ${
                    esSeleccionado
                      ? "bg-primary text-surface shadow-md scale-105"
                      : dia.esHoy
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "hover:bg-gray-200/70 text-text-main"
                  }`}
                >
                  <span
                    className={`text-[9px] uppercase font-bold ${esSeleccionado ? "text-accent" : "text-text-muted"}`}
                  >
                    {dia.nombre}
                  </span>
                  <span className="text-sm font-bold font-title mt-0.5">
                    {dia.numeroDia}
                  </span>

                  <div className="mt-1.5 flex gap-0.5 justify-center min-h-[6px]">
                    {tareasDelDia.length > 0 ? (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${pendientesDelDia > 0 ? (esSeleccionado ? "bg-accent animate-pulse" : "bg-amber-500 animate-pulse") : "bg-success"}`}
                      />
                    ) : (
                      <span className="w-1 h-1 rounded-full bg-gray-300/60" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex-1 flex flex-col space-y-2">
            <div className="flex justify-between items-center text-[10px] text-text-muted font-mono uppercase tracking-wider px-0.5">
              <span>Obligaciones para el día:</span>
              <span className="font-bold text-primary bg-gray-100 px-1.5 py-0.5 rounded">
                {infoDiaSeleccionado
                  ? `${infoDiaSeleccionado.nombre} ${infoDiaSeleccionado.numeroDia}`
                  : ""}
              </span>
            </div>

            <div className="overflow-y-auto max-h-[145px] space-y-2 pr-1 flex-1">
              {tareasDiaSeleccionado.length === 0 ? (
                <div className="text-center py-8 text-text-muted space-y-1">
                  <AlertCircle className="w-5 h-5 text-text-muted/40 mx-auto" />
                  <p className="text-[11px] font-medium">
                    No registras vencimientos este día.
                  </p>
                </div>
              ) : (
                tareasDiaSeleccionado.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => navigate(`/clientes/${t.clientes.id}`)}
                    className="p-2 bg-gray-50 border border-gray-100 rounded-md flex justify-between items-center text-[11px] hover:shadow-2xs transition-all animate-in fade-in zoom-in-95 duration-100 cursor-pointer"
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
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
