import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useDashboardMetricas, useDashboardDistribucion } from "./useDashboard";
import { useVencimientosMes } from "../calendario/useVencimientos";
import { useTareas } from "../tareas/useTareas";
import { Loader } from "../../components/Loader";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  CalendarDays,
  AlertCircle,
  ChevronRight,
  Flame,
  ListFilter,
  AlertTriangle,
  ClipboardList,
} from "lucide-react";
import { AlertNotification } from "../../components/ui/AlertNotification";
import { useNavigate } from "react-router-dom";

const calcularDiasRestantes = (fechaLimiteStr: string): number => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const [anio, mes, dia] = fechaLimiteStr.split("-").map(Number);
  const fechaVencimiento = new Date(anio, mes - 1, dia);

  const diferenciaTiempo = fechaVencimiento.getTime() - hoy.getTime();
  return Math.ceil(diferenciaTiempo / (1000 * 60 * 60 * 24));
};

export const DashboardPage = () => {
  const { perfil, session } = useAuth();
  const navigate = useNavigate();
  const [diasSemana, setDiasSemana] = useState<any[]>([]);
  const [diaSeleccionado, setDiaSeleccionado] = useState<string>("");
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const hoy = new Date();
  const esIngeniero = perfil?.cargo === "Ingeniero";

  const {
    data: metricas,
    isLoading: loadingMetricas,
    error: errorMetricas,
  } = useDashboardMetricas(session?.user?.id, perfil?.cargo);

  const { data: vencimientosSemana = [], isLoading: loadingVencimientos } =
    useVencimientosMes(
      hoy.getFullYear(),
      hoy.getMonth(),
      session?.user?.id,
      perfil?.cargo,
    );

  const { data: tareas = [], isLoading: loadingTareas } = useTareas(
    session?.user?.id,
    perfil?.cargo,
  );

  const { data: resumenImpuestos = [], isLoading: loadingDistribucion } =
    useDashboardDistribucion(esIngeniero && !!perfil);

  const calcularSemanaActual = () => {
    const hoy = new Date();
    const diaActual = hoy.getDay();
    const distanciaAlLunes = diaActual === 0 ? -6 : 1 - diaActual;

    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() + distanciaAlLunes);

    const nombresDias = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    const semana: any[] = [];
    let banderaDiaSeleccionado = "";

    for (let i = 0; i < 7; i++) {
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

  const vtosDiaSeleccionado = vencimientosSemana.filter(
    (v) => v.fecha_limite === diaSeleccionado,
  );

  const tareasDiaSeleccionado = tareas.filter(
    (t) => t.fecha_limite === diaSeleccionado,
  );

  const infoDiaSeleccionado = diasSemana.find(
    (d) => d.fechaStr === diaSeleccionado,
  );

  const isLoading =
    loadingMetricas ||
    loadingVencimientos ||
    loadingTareas ||
    (esIngeniero && loadingDistribucion);

  if (isLoading) {
    return (
      <Loader
        texto="Sincronizando panel de control operativo..."
        fullScreen={false}
      />
    );
  }

  const errorAMostrar = errorMetricas?.message || errorLocal;

  if (errorAMostrar || !metricas) {
    return (
      <div className="max-w-md mx-auto text-center p-8 bg-surface border border-text-muted/20 rounded-xl shadow-sm my-12 space-y-4">
        <AlertCircle className="w-12 h-12 text-danger mx-auto stroke-[1.5]" />
        <h2 className="text-lg font-bold text-primary font-title">
          Sincronización Incompleta
        </h2>
        <p className="text-xs text-text-muted leading-relaxed">
          El panel no pudo procesar las obligaciones asociadas al cargo actual:{" "}
          <span className="font-bold">"{perfil?.cargo || "Indefinido"}"</span>.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-primary text-surface text-xs font-semibold px-4 py-2 rounded-lg hover:bg-primary/90 transition-all shadow-xs cursor-pointer"
        >
          Reintentar Cargar Dashboard
        </button>
      </div>
    );
  }

  const localTodayStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
  const totalActividadesDia =
    vtosDiaSeleccionado.length + tareasDiaSeleccionado.length;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
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

      {errorLocal && (
        <div className="animate-in fade-in duration-200 max-w-4xl">
          <AlertNotification
            type="warning"
            title="Sincronización Incompleta"
            message={errorLocal}
            onClose={() => setErrorLocal(null)}
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="card-container bg-surface p-5 rounded-xl border border-text-muted/20 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              {esIngeniero ? "Total Empresas" : "Mis Empresas"}
            </span>
            <p className="text-3xl font-bold text-primary font-title">
              {metricas.totalClientes}
            </p>
            <p className="text-[11px] text-text-muted">
              {esIngeniero
                ? "Empresas dadas de alta en el sistema"
                : "Clientes bajo tu cargo"}
            </p>
          </div>
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="card-container bg-surface p-5 rounded-xl border border-text-muted/20 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              {esIngeniero ? "Vencimientos Firma" : "Vencimientos Mes"}
            </span>
            <p className="text-3xl font-bold text-primary font-title">
              {metricas.totalVencimientos}
            </p>
            <p className="text-[11px] text-text-muted">
              {esIngeniero
                ? "Calendarios totales sembrados este mes"
                : "Obligaciones totales del periodo"}
            </p>
          </div>
          <div className="w-12 h-12 bg-accent/20 text-primary rounded-xl flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="card-container bg-surface p-5 rounded-xl border border-text-muted/20 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              {esIngeniero ? "Pendientes Globales" : "Por Ejecutar"}
            </span>
            <p className="text-3xl font-bold text-warning font-title">
              {metricas.tareasPendientes}
            </p>
            <p className="text-[11px] text-text-muted">
              {esIngeniero
                ? "Tareas sin presentar de toda la firma"
                : "Pendientes y en revisión"}
            </p>
          </div>
          <div className="w-12 h-12 bg-warning/10 text-warning rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="card-container bg-surface p-5 rounded-xl border border-text-muted/20 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Cumplimiento
            </span>
            <p className="text-3xl font-bold text-success font-title">
              {metricas.porcentajeEfectividad}%
            </p>
            <p className="text-[11px] text-text-muted">
              {esIngeniero
                ? "Efectividad operativa global de la firma"
                : "Efectividad de presentation"}
            </p>
          </div>
          <div className="w-12 h-12 bg-success/10 text-success rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          {esIngeniero ? (
            <div className="card-container bg-surface p-6 rounded-xl border border-text-muted/20 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-primary border-b border-text-muted/10 pb-3">
                <ListFilter className="w-5 h-5 text-accent" />
                <h3 className="text-sm font-title font-bold uppercase tracking-wide">
                  Distribución Analítica de Obligaciones del Catálogo
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                {resumenImpuestos.map((imp) => (
                  <div
                    key={imp.id}
                    className="p-3 bg-background border border-text-muted/10 rounded-xl flex justify-between items-center"
                  >
                    <div className="truncate space-y-0.5 max-w-[70%]">
                      <p className="text-xs font-bold text-primary truncate">
                        {imp.nombre}
                      </p>
                      <p className="text-[10px] text-text-muted font-mono uppercase tracking-wider">
                        {imp.periodicidad}
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-md border border-primary/5">
                      {imp.empresasContadas} empresas
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card-container bg-surface p-6 rounded-xl border border-text-muted/20 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-primary border-b border-text-muted/10 pb-3">
                <AlertTriangle className="w-5 h-5 text-accent" />
                <h3 className="text-sm font-title font-bold uppercase tracking-wide">
                  Alertas Críticas de Vencimiento Semafórico
                </h3>
              </div>
              <div className="divide-y divide-text-muted/10">
                {metricas.alertasCriticas?.length === 0 ? (
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
                  metricas.alertasCriticas?.map((alerta: any) => {
                    const diasRestantes = calcularDiasRestantes(
                      alerta.fecha_limite,
                    );

                    let semaforoBadge =
                      "bg-text-muted/10 text-text-muted border-text-muted/20";
                    let semaforoTexto = `${diasRestantes} días`;

                    if (diasRestantes < 0) {
                      semaforoBadge =
                        "bg-danger text-surface border-danger font-extrabold animate-pulse shadow-sm";
                      semaforoTexto = `VENCIDO (${Math.abs(diasRestantes)}d)`;
                    } else if (diasRestantes === 0) {
                      semaforoBadge =
                        "bg-danger/10 text-danger border-danger/20 font-extrabold animate-pulse";
                      semaforoTexto = "¡VENCE HOY!";
                    } else if (diasRestantes === 1) {
                      semaforoBadge =
                        "bg-danger/10 text-danger border-danger/20 font-extrabold";
                      semaforoTexto = "¡VENCE MAÑANA!";
                    } else if (diasRestantes <= 3) {
                      semaforoBadge =
                        "bg-warning/10 text-warning border-warning/20 font-bold";
                      semaforoTexto = `Urgente: ${diasRestantes} días`;
                    }

                    return (
                      <div
                        key={alerta.id}
                        onClick={() =>
                          navigate(`/clientes/${alerta.clientes.id}`)
                        }
                        className="py-3 flex justify-between items-center hover:bg-background/60 px-2 rounded-lg cursor-pointer transition-colors group"
                      >
                        <div className="space-y-0.5 max-w-[65%]">
                          <p
                            className={`text-xs font-bold group-hover:text-accent transition-colors truncate ${diasRestantes < 0 ? "text-danger font-extrabold" : "text-primary"}`}
                          >
                            {alerta.clientes?.razon_social}
                          </p>
                          <p className="text-[11px] text-text-muted truncate">
                            {alerta.impuestos?.nombre} (Per:{" "}
                            {alerta.periodo_fiscal})
                          </p>
                        </div>
                        <div className="text-right flex items-center gap-3 shrink-0">
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase tracking-wider ${semaforoBadge}`}
                          >
                            {semaforoTexto}
                          </span>
                          <ChevronRight className="w-4 h-4 text-text-muted group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          <div className="card-container bg-surface p-6 rounded-xl border border-text-muted/20 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-primary border-b border-text-muted/10 pb-3">
              <Flame className="w-5 h-5 text-warning" />
              <h3 className="text-sm font-title font-bold uppercase tracking-wide">
                Top 5 Clientes con Mayor Carga Pendiente
              </h3>
            </div>

            {metricas.topClientesCarga?.length === 0 ? (
              <p className="text-xs text-text-muted italic py-4 text-center">
                Firma sin pendientes acumulados.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {metricas.topClientesCarga?.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 bg-background border border-text-muted/10 rounded-lg flex justify-between items-center"
                  >
                    <span className="text-xs font-semibold text-text-main truncate max-w-[75%]">
                      {item.nombre}
                    </span>
                    <span className="text-xs font-mono font-bold bg-warning/10 text-warning px-2 py-0.5 rounded border border-warning/20">
                      {item.pendientes} tgs
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card-container bg-surface p-5 rounded-xl border border-text-muted/20 shadow-sm space-y-4 flex flex-col h-full">
          <div className="flex items-center gap-2 border-b border-text-muted/10 pb-3">
            <CalendarDays className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-title font-bold text-primary uppercase tracking-wide">
              {esIngeniero
                ? "Cronograma Base de Control Global"
                : "Agenda Semanal de Trabajo"}
            </h3>
          </div>

          <div className="grid grid-cols-7 gap-1 bg-background p-1.5 rounded-lg border border-text-muted/10 shrink-0">
            {diasSemana.map((dia) => {
              const vtosDelDia = vencimientosSemana.filter(
                (v) => v.fecha_limite === dia.fechaStr,
              );
              const tareasDelDia = tareas.filter(
                (t) => t.fecha_limite === dia.fechaStr,
              );

              const pendientesVto = vtosDelDia.filter(
                (t) => t.estado_tarea !== "PRESENTADO",
              ).length;
              const pendientesTarea = tareasDelDia.filter(
                (t) => t.estado !== "COMPLETADA",
              ).length;
              const tienePendientes = pendientesVto > 0 || pendientesTarea > 0;

              const esSeleccionado = dia.fechaStr === diaSeleccionado;
              const esDiaPasado = dia.fechaStr < localTodayStr;

              return (
                <button
                  key={dia.fechaStr}
                  onClick={() => setDiaSeleccionado(dia.fechaStr)}
                  className={`flex flex-col items-center p-1.5 rounded-md transition-all outline-none cursor-pointer ${
                    esSeleccionado
                      ? "bg-primary text-surface shadow-md scale-105"
                      : dia.esHoy
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "hover:bg-text-muted/10 text-text-main"
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
                    {vtosDelDia.length > 0 || tareasDelDia.length > 0 ? (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          tienePendientes
                            ? esDiaPasado
                              ? "bg-danger animate-pulse"
                              : pendientesVto > 0
                                ? esSeleccionado
                                  ? "bg-accent"
                                  : "bg-warning"
                                : "bg-accent"
                            : "bg-success"
                        }`}
                      />
                    ) : (
                      <span className="w-1 h-1 rounded-full bg-text-muted/30" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex-1 flex flex-col space-y-3 pt-1">
            <div className="flex justify-between items-center text-[10px] text-text-muted font-mono uppercase tracking-wider px-0.5 shrink-0">
              <span>Actividades del día:</span>
              <span className="font-bold text-primary bg-text-muted/10 px-1.5 py-0.5 rounded">
                {infoDiaSeleccionado
                  ? `${infoDiaSeleccionado.nombre} ${infoDiaSeleccionado.numeroDia}`
                  : ""}
              </span>
            </div>

            <div className="overflow-y-auto space-y-2 pr-1 flex-1">
              {totalActividadesDia === 0 ? (
                <div className="text-center py-12 text-text-muted space-y-2 border border-dashed border-text-muted/10 rounded-xl bg-background/30">
                  <AlertCircle className="w-5 h-5 text-text-muted/40 mx-auto" />
                  <p className="text-[11px] font-medium">
                    No se registran actividades para este día.
                  </p>
                </div>
              ) : (
                <>
                  {vtosDiaSeleccionado.map((t) => {
                    const esVencidoHistorico =
                      t.estado_tarea !== "PRESENTADO" &&
                      t.fecha_limite < localTodayStr;
                    return (
                      <div
                        key={t.id}
                        onClick={() => navigate(`/clientes/${t.clientes?.id}`)}
                        className="p-3 bg-background border border-text-muted/10 rounded-lg flex justify-between items-center text-[11px] hover:shadow-sm hover:bg-surface hover:border-text-muted/20 transition-all cursor-pointer group"
                      >
                        <div className="truncate space-y-0.5 max-w-[70%]">
                          <p
                            className={`font-bold truncate group-hover:text-accent transition-colors ${esVencidoHistorico ? "text-danger" : "text-primary"}`}
                          >
                            {t.clientes?.razon_social}
                          </p>
                          <p className="text-text-muted truncate font-medium">
                            {t.impuestos?.nombre}
                          </p>
                        </div>
                        <span
                          className={`text-[9px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wide shrink-0 ${
                            t.estado_tarea === "PRESENTADO"
                              ? "bg-success/10 text-success border-success/20"
                              : esVencidoHistorico
                                ? "bg-danger text-surface border-danger animate-pulse font-extrabold"
                                : "bg-warning/10 text-warning border-warning/20"
                          }`}
                        >
                          {esVencidoHistorico ? "VENCIDO" : t.estado_tarea}
                        </span>
                      </div>
                    );
                  })}

                  {tareasDiaSeleccionado.map((t) => {
                    const esCompletada = t.estado === "COMPLETADA";
                    const esVencida =
                      !esCompletada && t.fecha_limite < localTodayStr;

                    let badgeStyle =
                      "bg-warning/10 text-warning border-warning/20";
                    let badgeText = "PENDIENTE";

                    if (esCompletada) {
                      badgeStyle =
                        "bg-success/10 text-success border-success/20";
                      badgeText = "COMPLETADA";
                    } else if (esVencida) {
                      badgeStyle =
                        "bg-danger text-surface border-danger animate-pulse font-extrabold";
                      badgeText = "VENCIDA";
                    }

                    return (
                      <div
                        key={t.id}
                        onClick={() => navigate("/tareas")}
                        className={`p-3 border-2 rounded-lg flex justify-between items-center text-[11px] hover:shadow-sm hover:bg-surface transition-all cursor-pointer group ${esVencida ? "border-danger bg-danger/5" : esCompletada ? "border-success/40 bg-background/50" : "border-warning/30 bg-background"}`}
                      >
                        <div className="truncate space-y-0.5 max-w-[70%]">
                          <p
                            className={`font-bold truncate group-hover:text-accent transition-colors flex items-center gap-1 ${esCompletada ? "text-text-muted line-through" : esVencida ? "text-danger" : "text-primary"}`}
                          >
                            <ClipboardList className="w-3 h-3 text-text-muted shrink-0" />
                            {t.titulo}
                          </p>
                          {esIngeniero && (
                            <p className="text-[9px] text-text-muted font-semibold truncate">
                              Asignado a: {t.usuarios?.nombre_completo}
                            </p>
                          )}
                        </div>
                        <span
                          className={`text-[9px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wide shrink-0 ${badgeStyle}`}
                        >
                          {badgeText}
                        </span>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
