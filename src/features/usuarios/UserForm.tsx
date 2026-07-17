import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  usuarioSchema,
  type UsuarioFormData,
  CARGOS_PERMITIDOS,
  ESTADOS_USUARIO,
  type Usuario,
} from "./types";
import { X, Save } from "lucide-react";
import { useCreateUsuario, useUpdateUsuario } from "./useUsuarios";
import { AlertNotification } from "../../components/ui/AlertNotification";

interface UserFormProps {
  onClose: () => void;
  onSuccess: () => void;
  usuarioAEditar?: Usuario | null;
}

export const UserForm = ({
  onClose,
  onSuccess,
  usuarioAEditar,
}: UserFormProps) => {
  const [errorPersistencia, setErrorPersistencia] = useState<string | null>(
    null,
  );

  const createMutation = useCreateUsuario();
  const updateMutation = useUpdateUsuario();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UsuarioFormData>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: { estado: "ACTIVO" },
  });

  const isEditing = !!usuarioAEditar;

  useEffect(() => {
    if (usuarioAEditar) {
      reset({
        username: usuarioAEditar.username,
        nombre_completo: usuarioAEditar.nombre_completo,
        email: usuarioAEditar.email || "",
        correo_notificacion: usuarioAEditar.correo_notificacion || "",
        cargo: usuarioAEditar.cargo as any,
        estado: usuarioAEditar.estado as any,
      });
    }
  }, [usuarioAEditar, reset]);

  const onSubmit = async (data: UsuarioFormData) => {
    setErrorPersistencia(null);

    if (isEditing && usuarioAEditar) {
      updateMutation.mutate(
        { id: usuarioAEditar.id, payload: data },
        {
          onSuccess: () => onSuccess(),
          onError: (err: any) =>
            setErrorPersistencia(
              err.message || "No se pudo actualizar el miembro del equipo.",
            ),
        },
      );
    } else {
      const generatedEmail = `${data.username.toLowerCase().trim()}@villarreal-romero.local`;
      const dataAEnviar = {
        ...data,
        email: generatedEmail,
        correo_notificacion: data.correo_notificacion?.trim() || null,
      };

      createMutation.mutate(dataAEnviar as UsuarioFormData, {
        onSuccess: () => onSuccess(),
        onError: (err: any) =>
          setErrorPersistencia(
            err.message ||
              "Fallo del microservicio al dar de alta al nuevo usuario.",
          ),
      });
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-text-muted/20">
        <div className="bg-primary p-4 flex justify-between items-center">
          <h2 className="text-surface font-title font-semibold text-sm">
            {isEditing
              ? "Editar Miembro del Equipo"
              : "Registrar Nuevo Miembro"}
          </h2>
          <button
            onClick={onClose}
            className="text-surface/70 hover:text-surface cursor-pointer transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="p-6 space-y-4 bg-surface"
        >
          {errorPersistencia && (
            <div className="animate-in fade-in duration-200">
              <AlertNotification
                type="error"
                title="Error de Persistencia"
                message={errorPersistencia}
                onClose={() => setErrorPersistencia(null)}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-main mb-1">
                Username
              </label>
              <input
                {...register("username")}
                disabled={isEditing}
                className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-accent outline-none text-sm bg-surface transition-colors ${
                  errors.username ? "border-danger" : "border-text-muted/30"
                } ${isEditing ? "bg-text-muted/10 cursor-not-allowed border-text-muted/20" : ""}`}
                placeholder="juan.perez"
              />
              {errors.username && (
                <p className="text-danger text-xs mt-1">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-main mb-1">
                Cargo
              </label>
              <select
                {...register("cargo")}
                className="w-full px-3 py-2 border border-text-muted/30 rounded-md focus:ring-1 focus:ring-accent outline-none bg-surface text-sm cursor-pointer transition-colors appearance-none"
              >
                {CARGOS_PERMITIDOS.map((cargo) => (
                  <option key={cargo} value={cargo}>
                    {cargo}
                  </option>
                ))}
              </select>
              {errors.cargo && (
                <p className="text-danger text-xs mt-1">
                  {errors.cargo.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-main mb-1">
              Nombre Completo
            </label>
            <input
              {...register("nombre_completo")}
              className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-accent outline-none text-sm bg-surface transition-colors ${
                errors.nombre_completo
                  ? "border-danger"
                  : "border-text-muted/30"
              }`}
            />
            {errors.nombre_completo && (
              <p className="text-danger text-xs mt-1">
                {errors.nombre_completo.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-main mb-1">
              Email para Alertas{" "}
              <span className="text-text-muted font-normal text-xs">
                (Opcional)
              </span>
            </label>
            <input
              {...register("correo_notificacion")}
              className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-accent outline-none text-sm bg-surface transition-colors ${
                errors.correo_notificacion
                  ? "border-danger"
                  : "border-text-muted/30"
              }`}
              placeholder="alertas@correo.com"
            />
            {errors.correo_notificacion && (
              <p className="text-danger text-xs mt-1">
                {errors.correo_notificacion.message}
              </p>
            )}
          </div>

          {isEditing && (
            <div>
              <label className="block text-sm font-medium text-text-main mb-1">
                Estado de Acceso
              </label>
              <select
                {...register("estado")}
                className="w-full px-3 py-2 border border-text-muted/30 rounded-md focus:ring-1 focus:ring-accent outline-none bg-surface text-sm cursor-pointer transition-colors appearance-none"
              >
                {ESTADOS_USUARIO.map((est) => (
                  <option key={est} value={est}>
                    {est}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-text-muted/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-text-muted hover:bg-text-muted/10 rounded-md transition-colors text-sm font-medium cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-accent hover:bg-accent/90 text-primary font-semibold px-6 py-2 rounded-md flex items-center gap-2 transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed text-sm cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {isSubmitting
                ? "Guardando..."
                : isEditing
                  ? "Actualizar Usuario"
                  : "Guardar Usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
