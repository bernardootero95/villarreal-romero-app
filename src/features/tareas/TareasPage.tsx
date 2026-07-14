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

  const tareasFiltradas = tareas.filter(
    (t) => filtroEstado === "TODAS" || t.estado === filtroEstado,
  );

  const handleEdit = (tarea: Tarea) => {
    setTareaEditando(tarea);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("¿Seguro que deseas eliminar esta tarea?")) {
      deleteMutation.mutate(id);
    }
  };

  const toggleEstado = (id: string, estadoActual: string) => {
    const nuevoEstado =
      estadoActual === "COMPLETADA" ? "PENDIENTE" : "COMPLETADA";
    estadoMutation.mutate({ id, estado: nuevoEstado });
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
        <button
          onClick={() => {
            setTareaEditando(null);
            setShowForm(true);
          }}
          className="bg-primary text-surface px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-all shadow-sm text-sm font-semibold cursor-pointer"
        >
          <Plus className="w-5 h-5" /> Nueva Tarea
        </button>
      </div>

      {error && (
        <AlertNotification
          type="error"
          title="Error de Red"
          message={error.message}
        />
      )}

      <div className="flex gap-2 border-b border-gray-200 pb-4">
        {/* REFACTOR: Eliminado el estado EN_PROGRESO de los filtros */}
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
          tareasFiltradas.map((tarea) => (
            <div
              key={tarea.id}
              className="bg-surface border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-primary font-title leading-tight">
                    {tarea.titulo}
                  </h3>
                  <button
                    onClick={() => toggleEstado(tarea.id, tarea.estado)}
                    className="shrink-0 cursor-pointer"
                  >
                    <CheckCircle2
                      className={`w-6 h-6 transition-colors ${tarea.estado === "COMPLETADA" ? "text-success" : "text-gray-300 hover:text-success/50"}`}
                    />
                  </button>
                </div>
                {tarea.descripcion && (
                  <p className="text-xs text-text-muted line-clamp-3 mb-4">
                    {tarea.descripcion}
                  </p>
                )}
              </div>

              <div className="border-t border-gray-100 pt-3 mt-4 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="flex items-center gap-1.5 text-[11px] font-mono text-text-muted">
                    <Clock className="w-3.5 h-3.5" />
                    Vence:{" "}
                    {new Date(
                      tarea.fecha_limite + "T12:00:00",
                    ).toLocaleDateString("es-CO")}
                  </span>
                  {perfil?.cargo === "Gerente" ||
                  perfil?.cargo === "Ingeniero" ? (
                    <p className="text-[10px] text-accent font-bold uppercase tracking-wider mt-1">
                      Asignado a: {tarea.usuarios?.nombre_completo}
                    </p>
                  ) : null}
                </div>

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
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <TareaForm
          tareaAEditar={tareaEditando}
          onClose={() => setShowForm(false)}
          onSuccess={() => setShowForm(false)}
        />
      )}
    </div>
  );
};
