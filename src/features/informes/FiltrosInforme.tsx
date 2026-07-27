import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { filtrosInformeSchema, type FiltrosInformeData } from "./types";
import { Filter, Search } from "lucide-react";
import { useUsuarios } from "../usuarios/useUsuarios";

interface FiltrosInformeProps {
  onAplicarFiltros: (filtros: FiltrosInformeData) => void;
  filtrosActuales: FiltrosInformeData;
}

export const FiltrosInforme = ({
  onAplicarFiltros,
  filtrosActuales,
}: FiltrosInformeProps) => {
  const { data: usuarios = [] } = useUsuarios();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FiltrosInformeData>({
    resolver: zodResolver(filtrosInformeSchema),
    defaultValues: filtrosActuales,
  });

  return (
    <form
      onSubmit={handleSubmit(onAplicarFiltros)}
      className="bg-surface p-4 rounded-xl border border-text-muted/20 shadow-sm space-y-4"
    >
      <div className="flex items-center gap-2 text-primary font-title font-semibold text-sm border-b border-text-muted/10 pb-2">
        <Filter className="w-4 h-4 text-accent" />
        <span>Filtros del Informe de Vencimientos</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-text-muted uppercase mb-1">
            Fecha Inicio
          </label>
          <input
            type="date"
            {...register("fechaInicio")}
            className={`w-full px-3 py-1.5 border rounded-md bg-surface text-sm focus:ring-1 focus:ring-accent outline-none transition-colors ${
              errors.fechaInicio ? "border-danger" : "border-text-muted/30"
            }`}
          />
          {errors.fechaInicio && (
            <p className="text-danger text-[11px] mt-1">
              {errors.fechaInicio.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-text-muted uppercase mb-1">
            Fecha Fin
          </label>
          <input
            type="date"
            {...register("fechaFin")}
            className={`w-full px-3 py-1.5 border rounded-md bg-surface text-sm focus:ring-1 focus:ring-accent outline-none transition-colors ${
              errors.fechaFin ? "border-danger" : "border-text-muted/30"
            }`}
          />
          {errors.fechaFin && (
            <p className="text-danger text-[11px] mt-1">
              {errors.fechaFin.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-text-muted uppercase mb-1">
            Especialista / Contador (Opcional)
          </label>
          <select
            {...register("usuarioId")}
            className="w-full px-3 py-1.5 border border-text-muted/30 rounded-md bg-surface text-sm focus:ring-1 focus:ring-accent outline-none transition-colors appearance-none cursor-pointer"
          >
            <option value="">Todos los empleados</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre_completo} ({u.cargo})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          className="bg-primary hover:bg-primary/90 text-surface text-xs font-semibold px-5 py-2 rounded-md flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
        >
          <Search className="w-3.5 h-3.5" />
          Actualizar Reporte
        </button>
      </div>
    </form>
  );
};
