import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { vencimientosService, type Vencimiento } from "./vencimientosService";
import { Loader } from "../../components/Loader";
import { AlertNotification } from "../../components/ui/AlertNotification"; // <-- Importación del componente de alertas inyectado
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  X,
  CheckCircle,
  CheckSquare,
} from "lucide-react";

export const CalendarioPage = () => {
  const { perfil } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [vencimientos, setVencimientos] = useState<Vencimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [radicados, setRadicados] = useState<Record<string, string>>({});
  const [guardandoId, setGuardandoId] = useState<string | null>(null);

  // LÓGICA SOLID (SRP): Estado unificado para el manejo de fallas de red/persistencia en el calendario
  const [operError, setOperError] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchDatos = async () => {
    if (!perfil) return;
    try {
      setLoading(true);
      setOperError(null);
      const data = await vencimientosService.getVencimientosMes(
        year,
        month,
        perfil.id,
        perfil.cargo,
      );
      setVencimientos(data);
    } catch (error: any) {
      console.error("Error cargando calendario:", error);
      setOperError(
        "No se pudieron sincronizar las fechas tributarias correspondientes al mes seleccionado.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatos();
  }, [year, month, perfil]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const vencimientosPorDia = vencimientos.reduce(
    (acc, v) => {
      if (!acc[v.fecha_limite]) acc[v.fecha_limite] = [];
      acc[v.fecha_limite].push(v);
      return acc;
    },
    {} as Record<string, Vencimiento[]>,
  );

  const meses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const handleMarcarPresentado = async (tareaId: string) => {
    const observacionText = radicados[tareaId] || "";
    try {
      setGuardandoId(tareaId);
      setOperError(null);
      await vencimientosService.actualizarEstado(
        tareaId,
        "PRESENTADO",
        observacionText,
      );

      setRadicados((prev) => {
        const copia = { ...prev };
        delete copia[tareaId];
        return copia;
      });

      await fetchDatos();
    } catch (error: any) {
      setOperError(
        error.message ||
          "No se pudo actualizar el radicado de la obligación tributaria.",
      );
    } finally {
      setGuardandoId(null);
    }
  };

  const renderDayModal = () => {
    if (!selectedDate) return null;
    const tareasDelDia = vencimientosPorDia[selectedDate] || [];
    const fechaObj = new Date(selectedDate + "T12:00:00");
    const fechaFormateada = fechaObj.toLocaleDateString("es-CO", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return (
      <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-surface w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-gray-100">
          <div className="bg-primary p-4 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2 text-surface">
              <CalendarIcon className="w-5 h-5" />
              <h2 className="font-title font-semibold capitalize text-sm md:text-base">
                {fechaFormateada}
              </h2>
            </div>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-surface/70 hover:text-surface transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50 space-y-4">
            {tareasDelDia.length === 0 ? (
              <p className="text-center text-text-muted py-8 text-xs font-semibold">
                No hay vencimientos programados para este día.
              </p>
            ) : (
              <div className="space-y-4">
                {tareasDelDia.map((tarea) => {
                  const esPendiente = tarea.estado_tarea === "PENDIENTE";

                  return (
                    <div
                      key={tarea.id}
                      className="bg-surface border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in zoom-in-95 duration-100"
                    >
                      <div className="flex-1 space-y-1">
                        <h4 className="font-bold text-primary text-base leading-tight">
                          {tarea.clientes.razon_social}
                        </h4>
                        <p className="text-xs text-text-muted font-mono">
                          NIT: {tarea.clientes.nit}-{tarea.clientes.dv}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2 py-0.5 rounded font-semibold">
                            {tarea.impuestos.nombre}
                          </span>
                          <span className="text-xs text-text-muted font-medium bg-gray-100 px-2 py-0.5 rounded">
                            Periodo: {tarea.periodo_fiscal}
                          </span>
                        </div>

                        {!esPendiente && tarea.observaciones && (
                          <p className="text-xs text-success bg-success/5 border border-success/10 px-2 py-1 rounded mt-2 font-medium">
                            <b>Radicado / Notas:</b> {tarea.observaciones}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end justify-center shrink-0 min-w-[200px] gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                        {tarea.estado_tarea === "PRESENTADO" ? (
                          <span className="flex items-center gap-1.5 text-sm font-bold text-success bg-success/10 px-3 py-1 rounded-full border border-success/10">
                            <CheckCircle className="w-4 h-4" /> Presentado
                          </span>
                        ) : (
                          <div className="w-full space-y-2">
                            <input
                              type="text"
                              value={radicados[tarea.id] || ""}
                              onChange={(e) =>
                                setRadicados({
                                  ...radicados,
                                  [tarea.id]: e.target.value,
                                })
                              }
                              placeholder="N° Radicado de la DIAN..."
                              className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded bg-surface outline-none focus:ring-1 focus:ring-accent"
                            />
                            <button
                              onClick={() => handleMarcarPresentado(tarea.id)}
                              disabled={guardandoId === tarea.id}
                              className="w-full bg-success hover:bg-success/90 text-white text-xs px-3 py-1.5 rounded font-semibold flex items-center justify-center gap-1 transition-all shadow-xs disabled:opacity-50"
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                              {guardandoId === tarea.id
                                ? "Guardando..."
                                : "Marcar Presentado"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <Loader texto="Sincronizando calendario..." fullScreen={false} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-title font-bold text-primary">
            Calendario Tributario
          </h1>
          <p className="text-text-muted">
            Vista general de obligaciones y vencimientos.
          </p>
        </div>

        <div className="flex items-center bg-surface border border-gray-200 rounded-lg p-1 shadow-sm">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 rounded text-text-main transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToToday}
            className="px-4 py-1 text-sm font-semibold text-primary hover:bg-gray-100 rounded transition-colors"
          >
            Hoy
          </button>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded text-text-main transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* LÓGICA SOLID (SRP): Renderizado condicional del componente inyectado si existe error operativo */}
      {operError && (
        <div className="animate-in fade-in duration-200 max-w-4xl">
          <AlertNotification
            type="error"
            title="Error de Operación"
            message={operError}
            onClose={() => setOperError(null)}
          />
        </div>
      )}

      <div className="card-container !p-0 overflow-hidden bg-surface shadow-lg border border-gray-200 rounded-xl">
        <div className="p-4 border-b border-gray-100 bg-gray-50/80 text-center">
          <h2 className="text-xl font-title font-bold text-primary">
            {meses[month]} {year}
          </h2>
        </div>

        <div className="grid grid-cols-7 border-b border-gray-200">
          {diasSemana.map((d) => (
            <div
              key={d}
              className="py-2 text-center text-xs font-bold text-text-muted uppercase tracking-wider"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 auto-rows-[100px] md:auto-rows-[120px] bg-gray-200 gap-px border-b border-gray-200">
          {blanks.map((b) => (
            <div key={`blank-${b}`} className="bg-gray-50/50" />
          ))}

          {days.map((day) => {
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const tareasDelDia = vencimientosPorDia[dateStr] || [];
            const isToday = new Date().toISOString().split("T")[0] === dateStr;

            const pendientes = tareasDelDia.filter(
              (t) => t.estado_tarea === "PENDIENTE",
            ).length;

            return (
              <div
                key={day}
                onClick={() => setSelectedDate(dateStr)}
                className="bg-surface p-2 flex flex-col hover:bg-blue-50/50 cursor-pointer transition-colors relative group"
              >
                <div className="flex justify-between items-start">
                  <span
                    className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? "bg-accent text-primary shadow-sm" : "text-text-main group-hover:text-accent"}`}
                  >
                    {day}
                  </span>
                </div>

                <div className="mt-2 flex-1 overflow-hidden flex flex-col gap-1">
                  {tareasDelDia.length > 0 ? (
                    <>
                      <div className="flex flex-wrap gap-1">
                        {tareasDelDia.slice(0, 4).map((t, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full ${t.estado_tarea === "PRESENTADO" ? "bg-success" : "bg-danger"}`}
                          />
                        ))}
                      </div>

                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded mt-auto w-fit ${pendientes === 0 ? "bg-success/10 text-success" : "bg-amber-100 text-text-main"}`}
                      >
                        {tareasDelDia.length} vto
                        {tareasDelDia.length > 1 ? "s" : ""}{" "}
                        {pendientes > 0 && `(${pendientes} P)`}
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {renderDayModal()}
    </div>
  );
};
