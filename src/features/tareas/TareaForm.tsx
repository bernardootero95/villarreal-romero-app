import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tareaSchema, type TareaFormData, type Tarea } from "./types";
import { X, Save, ClipboardList } from "lucide-react";
import { useCreateTarea, useUpdateTarea } from "./useTareas";
import { useUsuarios } from "../usuarios/useUsuarios";
import { useAuth } from "../../contexts/AuthContext";
import { AlertNotification } from "../../components/ui/AlertNotification";

interface TareaFormProps {
  onClose: () => void;
  onSuccess: () => void;
  tareaAEditar?: Tarea | null;
}

export const TareaForm = ({
  onClose,
  onSuccess,
  tareaAEditar,
}: TareaFormProps) => {
  const { perfil } = useAuth();
  const [errorPersistencia, setErrorPersistencia] = useState<string | null>(
    null,
  );

  const { data: usuarios = [], isLoading: loadingUsuarios } = useUsuarios();
  const createMutation = useCreateTarea();
  const updateMutation = useUpdateTarea();

  const puedeAdministrar =
    perfil && ["Gerente", "Ingeniero"].includes(perfil.cargo);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TareaFormData>({
    resolver: zodResolver(tareaSchema),
    defaultValues: {
      estado: "PENDIENTE",
      usuario_id: perfil?.id || "",
    },
  });

  const isEditing = !!tareaAEditar;

  useEffect(() => {
    if (tareaAEditar) {
      reset({
        titulo: tareaAEditar.titulo,
        descripcion: tareaAEditar.descripcion || "",
        fecha_limite: tareaAEditar.fecha_limite,
        usuario_id: tareaAEditar.usuario_id,
        estado: tareaAEditar.estado as any,
      });
    }
  }, [tareaAEditar, reset]);

  const onSubmit = async (data: TareaFormData) => {
    setErrorPersistencia(null);
    try {
      if (isEditing && tareaAEditar) {
        await updateMutation.mutateAsync({
          id: tareaAEditar.id,
          payload: data,
        });
      } else {
        await createMutation.mutateAsync(data);
      }
      onSuccess();
    } catch (err: any) {
      setErrorPersistencia(err.message || "Error al procesar la tarea.");
    }
  };

  const procesando = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-gray-200">
        <div className="bg-primary p-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-surface">
            <ClipboardList className="w-5 h-5" />
            <h2 className="font-title font-semibold text-sm">
              {isEditing ? "Editar Tarea" : "Nueva Tarea"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-surface/70 hover:text-surface cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {errorPersistencia && (
            <div className="animate-in fade-in duration-200">
              <AlertNotification
                type="error"
                title="Error"
                message={errorPersistencia}
                onClose={() => setErrorPersistencia(null)}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-main mb-1">
              Título de la tarea
            </label>
            <input
              {...register("titulo")}
              className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-accent outline-none text-sm bg-surface ${errors.titulo ? "border-danger" : "border-gray-300"}`}
              placeholder="Ej. Revisar estados financieros..."
            />
            {errors.titulo && (
              <p className="text-danger text-xs mt-1">
                {errors.titulo.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-main mb-1">
              Descripción (Opcional)
            </label>
            <textarea
              {...register("descripcion")}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-accent outline-none text-sm bg-surface"
              placeholder="Detalles adicionales de la tarea..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-main mb-1">
                Fecha Límite
              </label>
              <input
                type="date"
                {...register("fecha_limite")}
                className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-accent outline-none text-sm bg-surface ${errors.fecha_limite ? "border-danger" : "border-gray-300"}`}
              />
              {errors.fecha_limite && (
                <p className="text-danger text-xs mt-1">
                  {errors.fecha_limite.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-main mb-1">
                Asignar a
              </label>
              {puedeAdministrar ? (
                <select
                  {...register("usuario_id")}
                  disabled={loadingUsuarios}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-accent outline-none bg-surface text-sm cursor-pointer"
                >
                  <option value="">Seleccione usuario...</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre_completo} ({u.cargo})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  disabled
                  value={perfil?.nombre_completo || ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-sm cursor-not-allowed text-text-muted"
                />
              )}
              {errors.usuario_id && (
                <p className="text-danger text-xs mt-1">
                  {errors.usuario_id.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-text-muted hover:bg-gray-100 rounded-md transition-colors text-sm font-medium cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || procesando}
              className="bg-accent hover:bg-accent/90 text-primary font-semibold px-6 py-2 rounded-md flex items-center gap-2 transition-all shadow-md disabled:opacity-70 text-sm cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {procesando
                ? "Guardando..."
                : isEditing
                  ? "Actualizar"
                  : "Guardar Tarea"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
