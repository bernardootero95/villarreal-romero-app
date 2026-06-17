import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clienteSchema, type ClienteFormData } from "./types";
import { X, Save, Building2 } from "lucide-react";
import { clientesService } from "./clientesService";
import { usuariosService } from "../usuarios/usuariosService";
import type { Usuario } from "../usuarios/types";

interface ClienteFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const ClienteForm = ({ onClose, onSuccess }: ClienteFormProps) => {
  const [contadores, setContadores] = useState<Usuario[]>([]);
  const [loadingContadores, setLoadingContadores] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: { estado: "ACTIVO" },
  });

  // Cargar la lista de usuarios para el selector
  useEffect(() => {
    const cargarContadores = async () => {
      try {
        const data = await usuariosService.getAll();
        // Filtramos para que solo se le puedan asignar clientes a roles contables/gerenciales activos
        const contadoresValidos = data.filter(
          (u) =>
            ["Contador", "Gerente", "Auxiliar"].includes(u.cargo) &&
            u.estado === "ACTIVO",
        );
        setContadores(contadoresValidos);
      } catch (error) {
        console.error("Error cargando contadores:", error);
      } finally {
        setLoadingContadores(false);
      }
    };
    cargarContadores();
  }, []);

  const onSubmit = async (data: ClienteFormData) => {
    try {
      await clientesService.create(data);
      onSuccess();
    } catch (error: any) {
      alert(error.message || "Error al guardar el cliente");
    }
  };

  return (
    <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden border border-gray-200">
        <div className="bg-primary p-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-surface">
            <Building2 className="w-5 h-5" />
            <h2 className="font-title font-semibold">Registrar Cliente</h2>
          </div>
          <button
            onClick={onClose}
            className="text-surface/70 hover:text-surface transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Fila 1: NIT y DV */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-9 md:col-span-10">
              <label className="block text-sm font-medium text-text-main mb-1">
                NIT
              </label>
              <input
                {...register("nit")}
                className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-accent outline-none data-code ${errors.nit ? "border-danger" : "border-gray-300"}`}
                placeholder="Ej. 900123456"
              />
              {errors.nit && (
                <p className="text-danger text-xs mt-1">{errors.nit.message}</p>
              )}
            </div>

            <div className="col-span-3 md:col-span-2">
              <label className="block text-sm font-medium text-text-main mb-1">
                DV
              </label>
              <input
                {...register("dv")}
                type="number"
                min="0"
                max="9"
                className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-accent outline-none data-code text-center ${errors.dv ? "border-danger" : "border-gray-300"}`}
                placeholder="-"
              />
              {errors.dv && (
                <p className="text-danger text-xs mt-1">{errors.dv.message}</p>
              )}
            </div>
          </div>

          {/* Fila 2: Razón Social */}
          <div>
            <label className="block text-sm font-medium text-text-main mb-1">
              Razón Social / Nombre
            </label>
            <input
              {...register("razon_social")}
              className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-accent outline-none ${errors.razon_social ? "border-danger" : "border-gray-300"}`}
              placeholder="Nombre de la empresa o persona natural"
            />
            {errors.razon_social && (
              <p className="text-danger text-xs mt-1">
                {errors.razon_social.message}
              </p>
            )}
          </div>

          {/* Fila 3: Email y Contador Asignado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-main mb-1">
                Email de Contacto
              </label>
              <input
                {...register("email")}
                className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-accent outline-none ${errors.email ? "border-danger" : "border-gray-300"}`}
                placeholder="facturacion@empresa.com"
              />
              {errors.email && (
                <p className="text-danger text-xs mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-main mb-1">
                Contador Responsable
              </label>
              <select
                {...register("contador_id")}
                disabled={loadingContadores}
                className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-accent outline-none bg-surface ${errors.contador_id ? "border-danger" : "border-gray-300"}`}
              >
                <option value="">Seleccione un contador...</option>
                {contadores.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.nombre_completo} ({user.cargo})
                  </option>
                ))}
              </select>
              {errors.contador_id && (
                <p className="text-danger text-xs mt-1">
                  {errors.contador_id.message}
                </p>
              )}
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
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
              className="bg-accent hover:bg-accent/90 text-primary font-semibold px-6 py-2 rounded-md flex items-center gap-2 transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? "Guardando..." : "Guardar Cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
