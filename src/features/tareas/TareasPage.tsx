import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  useTareas,
  useDeleteTarea,
  useActualizarEstadoTarea,
} from "./useTareas";
import type { Tarea } from "./types";
import {
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  ListTodo,
} from "lucide-react";
import { TareaForm } from "./TareaForm";
import { Loader } from "../../components/Loader";
import { AlertNotification } from "../../components/ui/AlertNotification";

export const TareasPage = () => {
  const { perfil, session } = useAuth();

  const {
    data: tareas = [],
    isLoading,
    error,
  } = useTareas(session?.user?.id, perfil?.cargo);
  const deleteMutation = useDeleteTarea();
  const estadoMutation = useActualizarEstadoTarea();

  const [showForm, setShowForm] = useState(false);
  const [tareaEditando, setTareaEditando] = useState<Tarea | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>("TODAS");

  const puedeAdministrar =
    perfil && ["Gerente", "Ingeniero"].includes(perfil.cargo);

  // Cálculo del día actual local para evaluar tareas vencidas en tiempo real
  const localDate = new Date();
  const localTodayStr = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, "0")}-${String(localDate.getDate()).padStart(2, "0")}`;

  const tareasFiltradas = tareas.filter(
    (t) => filtroEstado === "TODAS" || t.estado === filtroEstado,
  );

  const handleEdit = (tarea: Tarea) => {
    setTareaEditando(tarea);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (
      window.confirm(
        "¿Seguro que deseas eliminar esta tarea de la planificación?",
      )
    ) {
      deleteMutation.mutate(id);
    }
  };

  const completarTarea = (id: string, estadoActual: string) => {
    // REGLA DE NEGOCIO: Una vez completada, queda inmutable
    if (estadoActual === "COMPLETADA") return;
    estadoMutation.mutate({ id, estado: "COMPLETADA" });
  };

  if (isLoading) return <Loader texto="Sincronizando tareas..." />;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-title font-bold text-primary">
            Gestor de Tareas
          </h1>
          <p className="text-text-muted">
            Control de asignaciones y actividades pendientes.
          </p>
        </div>
        {puedeAdministrar && (
          <button
            onClick={() => {
              setTareaEditando(null);
              setShowForm(true);
            }}
            className="bg-primary text-surface px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-all shadow-sm text-sm font-semibold cursor-pointer"
          >
            <Plus className="w-5 h-5" /> Nueva Tarea
          </button>
        )}
      </div>

      {error && (
        <AlertNotification
          type="error"
          title="Error de Red"
          message={error.message}
        />
      )}

      <div className="flex gap-2 border-b border-gray-200 pb-4">
        {["TODAS", "PENDIENTE", "COMPLETADA"].map((est) => (
          <button
            key={est}
            onClick={() => setFiltroEstado(est)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              filtroEstado === est
                ? "bg-accent text-primary shadow-sm"
                : "bg-gray-100 text-text-muted hover:bg-gray-200"
            }`}
          >
            {est}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tareasFiltradas.length === 0 ? (
          <div className="col-span-full p-12 text-center border border-dashed border-gray-300 rounded-xl bg-gray-50/50">
            <ListTodo className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-text-main font-semibold">
              No hay tareas para mostrar.
            </p>
          </div>
        ) : (
          tareasFiltradas.map((tarea) => {
            const esCompletada = tarea.estado === "COMPLETADA";
            const esVencida =
              !esCompletada && tarea.fecha_limite < localTodayStr;

            // Semáforo dinámico de la Etiqueta (Badge)
            let badgeStyle = "bg-amber-100 text-amber-700 border-amber-200";
            let badgeText = "PENDIENTE";

            // Semáforo dinámico de la Tarjeta (Bordes)
            let cardStyle = "border-amber-400 bg-surface";

            if (esCompletada) {
              badgeStyle = "bg-success/10 text-success border-success/20";
              badgeText = "COMPLETADA";
              cardStyle = "border-success/60 bg-surface"; // Borde verde
            } else if (esVencida) {
              badgeStyle =
                "bg-danger text-white border-danger animate-pulse shadow-sm";
              badgeText = "VENCIDA";
              cardStyle = "border-danger bg-danger/5"; // Borde rojo y fondo ligeramente tintado
            }

            const isCompleting =
              estadoMutation.isPending &&
              estadoMutation.variables?.id === tarea.id;

            return (
              <div
                key={tarea.id}
                className={`border-2 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group ${cardStyle}`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3
                      className={`font-bold font-title leading-tight pr-2 ${esCompletada ? "text-text-muted line-through" : "text-primary"}`}
                    >
                      {tarea.titulo}
                    </h3>
                    <button
                      onClick={() => completarTarea(tarea.id, tarea.estado)}
                      disabled={esCompletada || isCompleting}
                      className="shrink-0 cursor-pointer disabled:cursor-not-allowed"
                      title={
                        esCompletada
                          ? "Tarea ya finalizada"
                          : "Marcar como completada"
                      }
                    >
                      <CheckCircle2
                        className={`w-6 h-6 transition-colors ${esCompletada ? "text-success" : esVencida ? "text-danger hover:text-success" : "text-gray-300 hover:text-success/50"}`}
                      />
                    </button>
                  </div>
                  {tarea.descripcion && (
                    <p
                      className={`text-xs line-clamp-3 mb-4 ${esCompletada ? "text-text-muted/60" : "text-text-muted"}`}
                    >
                      {tarea.descripcion}
                    </p>
                  )}
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider ${badgeStyle}`}
                  >
                    {badgeText}
                  </span>
                </div>

                <div className="border-t border-gray-100 pt-3 mt-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <span
                      className={`flex items-center gap-1.5 text-[11px] font-mono ${esVencida ? "text-danger font-bold" : "text-text-muted"}`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      Vence:{" "}
                      {new Date(
                        tarea.fecha_limite + "T12:00:00",
                      ).toLocaleDateString("es-CO")}
                    </span>
                    {puedeAdministrar ? (
                      <p className="text-[10px] text-accent font-bold uppercase tracking-wider">
                        Asignado a: {tarea.usuarios?.nombre_completo}
                      </p>
                    ) : null}
                  </div>

                  {puedeAdministrar && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(tarea)}
                        className="p-1.5 text-text-muted hover:text-accent bg-gray-50 rounded cursor-pointer"
                        title="Editar tarea"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(tarea.id)}
                        className="p-1.5 text-text-muted hover:text-danger bg-gray-50 rounded cursor-pointer"
                        title="Eliminar tarea"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {showForm && puedeAdministrar && (
        <TareaForm
          tareaAEditar={tareaEditando}
          onClose={() => setShowForm(false)}
          onSuccess={() => setShowForm(false)}
        />
      )}
    </div>
  );
};
