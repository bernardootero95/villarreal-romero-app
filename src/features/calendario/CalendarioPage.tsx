import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { vencimientosService, type Vencimiento } from "./vencimientosService";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  X,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";

export const CalendarioPage = () => {
  const { perfil } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [vencimientos, setVencimientos] = useState<Vencimiento[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado para el Modal de Detalle Diario
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-11

  useEffect(() => {
    const fetchDatos = async () => {
      if (!perfil) return;
      try {
        setLoading(true);
        const data = await vencimientosService.getVencimientosMes(
          year,
          month,
          perfil.id,
          perfil.cargo,
        );
        setVencimientos(data);
      } catch (error) {
        console.error("Error cargando calendario:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDatos();
  }, [year, month, perfil]);

  // Controles del calendario
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Lógica de Cuadrícula
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Domingo

  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Agrupar vencimientos por fecha (YYYY-MM-DD)
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

  // Renderizado del Modal de Día
  const renderDayModal = () => {
    if (!selectedDate) return null;
    const tareasDelDia = vencimientosPorDia[selectedDate] || [];

    // Formatear la fecha para lectura humana
    const fechaObj = new Date(selectedDate + "T12:00:00");
    const fechaFormateada = fechaObj.toLocaleDateString("es-CO", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return (
      <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-surface w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
          <div className="bg-primary p-4 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2 text-surface">
              <CalendarIcon className="w-5 h-5" />
              <h2 className="font-title font-semibold capitalize">
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

          <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
            {tareasDelDia.length === 0 ? (
              <p className="text-center text-text-muted py-8">
                No hay vencimientos programados para este día.
              </p>
            ) : (
              <div className="space-y-3">
                {tareasDelDia.map((tarea) => (
                  <div
                    key={tarea.id}
                    className="bg-surface border border-gray-200 rounded-lg p-4 shadow-sm flex items-start justify-between gap-4"
                  >
                    <div>
                      <h4 className="font-bold text-primary">
                        {tarea.clientes.razon_social}
                      </h4>
                      <p className="text-xs text-text-muted font-mono mb-2">
                        NIT: {tarea.clientes.nit}-{tarea.clientes.dv}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2 py-1 rounded font-semibold">
                          {tarea.impuestos.nombre}
                        </span>
                        <span className="text-xs text-text-muted font-medium bg-gray-100 px-2 py-1 rounded">
                          Periodo: {tarea.periodo_fiscal}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      {/* Badge de Estado Visual */}
                      {tarea.estado_tarea === "PRESENTADO" && (
                        <span className="flex items-center gap-1 text-xs font-bold text-success">
                          <CheckCircle className="w-3 h-3" /> Presentado
                        </span>
                      )}
                      {tarea.estado_tarea === "PENDIENTE" && (
                        <span className="flex items-center gap-1 text-xs font-bold text-amber-600">
                          <Clock className="w-3 h-3" /> Pendiente
                        </span>
                      )}
                      {tarea.estado_tarea === "VENCIDO" && (
                        <span className="flex items-center gap-1 text-xs font-bold text-danger">
                          <AlertTriangle className="w-3 h-3" /> Vencido
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
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

      <div className="card-container !p-0 overflow-hidden bg-surface">
        <div className="p-4 border-b border-gray-100 bg-gray-50/80 text-center">
          <h2 className="text-xl font-title font-bold text-primary">
            {meses[month]} {year}
          </h2>
        </div>

        {/* Días de la semana */}
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

        {/* Cuadrícula del Calendario */}
        <div className="grid grid-cols-7 auto-rows-[100px] md:auto-rows-[120px] bg-gray-200 gap-px border-b border-gray-200">
          {/* Celdas vacías del principio */}
          {blanks.map((b) => (
            <div key={`blank-${b}`} className="bg-gray-50/50" />
          ))}

          {/* Días del mes */}
          {days.map((day) => {
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const tareasDelDia = vencimientosPorDia[dateStr] || [];

            // Comprobar si el día renderizado es hoy
            const isToday = new Date().toISOString().split("T")[0] === dateStr;

            return (
              <div
                key={day}
                onClick={() => setSelectedDate(dateStr)}
                className={`bg-surface p-2 flex flex-col hover:bg-blue-50/50 cursor-pointer transition-colors relative group`}
              >
                <div className="flex justify-between items-start">
                  <span
                    className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? "bg-accent text-primary shadow-sm" : "text-text-main group-hover:text-accent"}`}
                  >
                    {day}
                  </span>
                </div>

                {/* Indicador de Tareas */}
                <div className="mt-2 flex-1 overflow-hidden flex flex-col gap-1">
                  {loading ? null : tareasDelDia.length > 0 ? (
                    <>
                      {/* Muestra un puntito rojo si hay tareas para dar un aspecto de mapa de calor rápido */}
                      <div className="flex flex-wrap gap-1">
                        {tareasDelDia.slice(0, 3).map((t, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full ${t.estado_tarea === "PRESENTADO" ? "bg-success" : "bg-danger"}`}
                          />
                        ))}
                        {tareasDelDia.length > 3 && (
                          <span className="text-[10px] text-text-muted leading-none">
                            +{tareasDelDia.length - 3}
                          </span>
                        )}
                      </div>

                      {/* Texto resumen */}
                      <span className="text-[10px] font-medium text-text-main bg-amber-100/50 px-1.5 py-0.5 rounded mt-auto w-fit">
                        {tareasDelDia.length} vto
                        {tareasDelDia.length > 1 ? "s" : ""}
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
