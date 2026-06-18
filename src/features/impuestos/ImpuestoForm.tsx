import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  impuestoSchema,
  type ImpuestoFormData,
  type ImpuestoConEspecialista,
  PERIODICIDADES,
  REGLAS_VENCIMIENTO,
} from "./types";
import { X, Save, Landmark } from "lucide-react";
import { impuestosService } from "./impuestosService";
import { usuariosService } from "../usuarios/usuariosService";
import type { Usuario } from "../usuarios/types";

interface ImpuestoFormProps {
  onClose: () => void;
  onSuccess: () => void;
  impuestoAEditar?: ImpuestoConEspecialista | null;
}

export const ImpuestoForm = ({
  onClose,
  onSuccess,
  impuestoAEditar,
}: ImpuestoFormProps) => {
  const [especialistas, setEspecialistas] = useState<Usuario[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ImpuestoFormData>({
    resolver: zodResolver(impuestoSchema),
    defaultValues: { estado: "ACTIVO", especialista_id: "" },
  });

  const isEditing = !!impuestoAEditar;

  useEffect(() => {
    if (impuestoAEditar) {
      reset({
        nombre: impuestoAEditar.nombre,
        periodicidad: impuestoAEditar.periodicidad as any,
        regla_vencimiento: impuestoAEditar.regla_vencimiento as any,
        especialista_id: impuestoAEditar.especialista_id || "",
        estado: impuestoAEditar.estado as "ACTIVO" | "INACTIVO",
      });
    }
  }, [impuestoAEditar, reset]);

  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        const data = await usuariosService.getAll();
        const activos = data.filter((u) => u.estado === "ACTIVO");
        setEspecialistas(activos);
      } catch (error) {
        console.error("Error cargando usuarios:", error);
      } finally {
        setLoadingUsers(false);
      }
    };
    cargarUsuarios();
  }, []);

  const onSubmit = async (data: ImpuestoFormData) => {
    try {
      if (isEditing && impuestoAEditar) {
        await impuestosService.update(impuestoAEditar.id, data);
      } else {
        await impuestosService.create(data);
      }
      onSuccess();
    } catch (error: any) {
      alert(error.message || "Error al guardar el impuesto");
    }
  };

  return (
    <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-gray-200">
        <div className="bg-primary p-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-surface">
            <Landmark className="w-5 h-5" />
            <h2 className="font-title font-semibold">
              {isEditing ? "Editar Impuesto" : "Crear Nuevo Impuesto"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-surface/70 hover:text-surface transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-main mb-1">
              Nombre del Impuesto u Obligación
            </label>
            <input
              {...register("nombre")}
              className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-accent outline-none ${errors.nombre ? "border-danger" : "border-gray-300"}`}
              placeholder="Ej. IVA Bimestral, ICA Medellín..."
            />
            {errors.nombre && (
              <p className="text-danger text-xs mt-1">
                {errors.nombre.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-main mb-1">
                Periodicidad
              </label>
              <select
                {...register("periodicidad")}
                className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-accent outline-none bg-surface ${errors.periodicidad ? "border-danger" : "border-gray-300"}`}
              >
                <option value="">Seleccione...</option>
                {PERIODICIDADES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              {errors.periodicidad && (
                <p className="text-danger text-xs mt-1">
                  {errors.periodicidad.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-main mb-1">
                Regla de Cálculo
              </label>
              <select
                {...register("regla_vencimiento")}
                className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-accent outline-none bg-surface ${errors.regla_vencimiento ? "border-danger" : "border-gray-300"}`}
              >
                <option value="">Seleccione...</option>
                {REGLAS_VENCIMIENTO.map((r) => (
                  <option key={r} value={r}>
                    {r.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
              {errors.regla_vencimiento && (
                <p className="text-danger text-xs mt-1">
                  {errors.regla_vencimiento.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-main mb-1">
              Especialista / Tercero Encargado{" "}
              <span className="text-text-muted text-xs font-normal">
                (Opcional)
              </span>
            </label>
            <select
              {...register("especialista_id")}
              disabled={loadingUsers}
              className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-accent outline-none bg-surface ${errors.especialista_id ? "border-danger" : "border-gray-300"}`}
            >
              <option value="">Ninguno (Responsabilidad del Contador)</option>
              {especialistas.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.nombre_completo} ({user.cargo})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-text-muted mt-1">
              Si seleccionas un especialista, las tareas de este impuesto
              también le aparecerán en su calendario.
            </p>
          </div>

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
              {isSubmitting
                ? "Guardando..."
                : isEditing
                  ? "Actualizar Impuesto"
                  : "Guardar Impuesto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
