import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useDashboardMetricas, useDashboardDistribucion } from "./useDashboard";
import { useVencimientosMes } from "../calendario/useVencimientos";
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

  const tareasDiaSeleccionado = vencimientosSemana.filter(
    (v) => v.fecha_limite === diaSeleccionado,
  );
  const infoDiaSeleccionado = diasSemana.find(
    (d) => d.fechaStr === diaSeleccionado,
  );

  const isLoading =
    loadingMetricas ||
    loadingVencimientos ||
    (esIngeniero && loadingDistribucion);

  if (isLoading) {
    return (
      <div className="text-center p-12 text-text-muted text-sm font-semibold font-mono uppercase tracking-wider animate-pulse">
        Sincronizando panel de control contable...
      </div>
    );
  }

  const errorAMostrar = errorMetricas?.message || errorLocal;

  if (errorAMostrar || !metricas) {
    return (
      <div className="max-w-md mx-auto text-center p-8 bg-surface border border-gray-200 rounded-xl shadow-sm my-12 space-y-4">
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
        <div className="card-container bg-surface p-5 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
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

        <div className="card-container bg-surface p-5 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
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

        <div className="card-container bg-surface p-5 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              {esIngeniero ? "Pendientes Globales" : "Por Ejecutar"}
            </span>
            <p className="text-3xl font-bold text-amber-600 font-title">
              {metricas.tareasPendientes}
            </p>
            <p className="text-[11px] text-text-muted">
              {esIngeniero
                ? "Tareas sin presentar de toda la firma"
                : "Pendientes y en revisión"}
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
            <div className="card-container bg-surface p-6 rounded-xl border border-gray-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 text-primary border-b border-gray-100 pb-3">
                <ListFilter className="w-5 h-5 text-accent" />
                <h3 className="text-sm font-title font-bold uppercase tracking-wide">
                  Distribución Analítica de Obligaciones del Catálogo
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                {resumenImpuestos.map((imp) => (
                  <div
                    key={imp.id}
                    className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex justify-between items-center"
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
            <div className="card-container bg-surface p-6 rounded-xl border border-gray-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 text-primary border-b border-gray-100 pb-3">
                <AlertTriangle className="w-5 h-5 text-accent" />
                <h3 className="text-sm font-title font-bold uppercase tracking-wide">
                  Alertas Críticas de Vencimiento Semafórico
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
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

                    // LÓGICA SOLID DE SEMÁFORO: Configuración de estilos dinámicos según el tiempo límite
                    let semaforoBadge =
                      "bg-gray-100 text-text-muted border-gray-200";
                    let semaforoTexto = `${diasRestantes} días`;

                    if (diasRestantes <= 1) {
                      semaforoBadge =
                        "bg-danger/10 text-danger border-danger/20 font-extrabold animate-pulse";
                      semaforoTexto =
                        diasRestantes === 0 ? "¡VENCE HOY!" : "¡VENCE MAÑANA!";
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
                        className="py-3 flex justify-between items-center hover:bg-gray-50/60 px-2 rounded-lg cursor-pointer transition-colors group"
                      >
                        <div className="space-y-0.5 max-w-[65%]">
                          <p className="text-xs font-bold text-primary group-hover:text-accent transition-colors truncate">
                            {alerta.clientes?.razon_social}
                          </p>
                          <p className="text-[11px] text-text-muted truncate">
                            {alerta.impuestos?.nombre} (Per:{" "}
                            {alerta.periodo_fiscal})
                          </p>
                        </div>
                        <div className="text-right flex items-center gap-3 shrink-0">
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded border ${semaforoBadge}`}
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

          <div className="card-container bg-surface p-6 rounded-xl border border-gray-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 text-primary border-b border-gray-100 pb-3">
              <Flame className="w-5 h-5 text-amber-500" />
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

        <div className="card-container bg-surface p-5 rounded-xl border border-gray-200 shadow-2xs space-y-4 flex flex-col h-full">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <CalendarDays className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-title font-bold text-primary uppercase tracking-wide">
              {esIngeniero
                ? "Cronograma Base de Control Global"
                : "Agenda Semanal de Trabajo"}
            </h3>
          </div>

          <div className="grid grid-cols-7 gap-1 bg-gray-50 p-1.5 rounded-lg border border-gray-100 shrink-0">
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
                  className={`flex flex-col items-center p-1.5 rounded-md transition-all outline-none cursor-pointer ${
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
                        className={`w-1.5 h-1.5 rounded-full ${
                          pendientesDelDia > 0
                            ? esSeleccionado
                              ? "bg-accent"
                              : "bg-amber-500"
                            : "bg-success"
                        }`}
                      />
                    ) : (
                      <span className="w-1 h-1 rounded-full bg-gray-300/60" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex-1 flex flex-col space-y-3 pt-1">
            <div className="flex justify-between items-center text-[10px] text-text-muted font-mono uppercase tracking-wider px-0.5 shrink-0">
              <span>Vencimientos del día:</span>
              <span className="font-bold text-primary bg-gray-100 px-1.5 py-0.5 rounded">
                {infoDiaSeleccionado
                  ? `${infoDiaSeleccionado.nombre} ${infoDiaSeleccionado.numeroDia}`
                  : ""}
              </span>
            </div>

            <div className="overflow-y-auto space-y-2 pr-1 flex-1">
              {tareasDiaSeleccionado.length === 0 ? (
                <div className="text-center py-12 text-text-muted space-y-2 border border-dashed border-gray-100 rounded-xl bg-gray-50/30">
                  <AlertCircle className="w-5 h-5 text-text-muted/40 mx-auto" />
                  <p className="text-[11px] font-medium">
                    No se registran tareas corporativas para este día.
                  </p>
                </div>
              ) : (
                tareasDiaSeleccionado.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => navigate(`/clientes/${t.clientes?.id}`)}
                    className="p-3 bg-gray-50 border border-gray-100 rounded-lg flex justify-between items-center text-[11px] hover:shadow-2xs hover:bg-white hover:border-gray-200 transition-all cursor-pointer group"
                  >
                    <div className="truncate space-y-0.5 max-w-[70%]">
                      <p className="font-bold text-primary truncate group-hover:text-accent transition-colors">
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
