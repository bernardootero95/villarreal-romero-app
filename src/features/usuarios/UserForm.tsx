import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usuarioSchema, UsuarioFormData, CARGOS_PERMITIDOS } from "./types";
import { X, Save } from "lucide-react";

interface UserFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const UserForm = ({ onClose, onSuccess }: UserFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UsuarioFormData>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: { estado: "ACTIVO" },
  });

  const onSubmit = async (data: UsuarioFormData) => {
    try {
      // Nota: En un flujo real, aquí llamaríamos a una función de Supabase
      // para crear el usuario en Auth primero.
      // Por ahora, simularemos la inserción en la tabla pública.
      alert(
        "Funcionalidad de creación en Auth requiere Edge Function. Procediendo con lógica de validación UI.",
      );
      onSuccess();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-gray-200">
        <div className="bg-primary p-4 flex justify-between items-center">
          <h2 className="text-surface font-title font-semibold">
            Registrar Nuevo Miembro
          </h2>
          <button
            onClick={onClose}
            className="text-surface/70 hover:text-surface"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-main mb-1">
                Username
              </label>
              <input
                {...register("username")}
                className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-accent outline-none ${errors.username ? "border-danger" : "border-gray-300"}`}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-accent outline-none bg-surface"
              >
                {CARGOS_PERMITIDOS.map((cargo) => (
                  <option key={cargo} value={cargo}>
                    {cargo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-main mb-1">
              Nombre Completo
            </label>
            <input
              {...register("nombre_completo")}
              className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-accent outline-none ${errors.nombre_completo ? "border-danger" : "border-gray-300"}`}
            />
            {errors.nombre_completo && (
              <p className="text-danger text-xs mt-1">
                {errors.nombre_completo.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-main mb-1">
              Email (Opcional)
            </label>
            <input
              {...register("email")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-accent outline-none"
              placeholder="ejemplo@correo.com"
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-text-muted hover:bg-gray-100 rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-accent hover:bg-accent/90 text-primary font-semibold px-6 py-2 rounded-md flex items-center gap-2 transition-all shadow-md"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? "Guardando..." : "Guardar Usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
