import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  calendarioBaseSchema,
  type CalendarioBaseFormData,
  type CalendarioBaseConImpuesto,
} from "./types";
import { X, Save, CalendarDays } from "lucide-react";
import { calendarioBaseService } from "./calendarioBaseService";
import { impuestosService } from "../impuestos/impuestosService";
import type { ImpuestoConEspecialista } from "../impuestos/types";
import { Loader } from "../../components/Loader";

interface CalendarioBaseFormProps {
  onClose: () => void;
  onSuccess: () => void;
  fechaAEditar?: CalendarioBaseConImpuesto | null;
  impuestoId: string;
}

export const CalendarioBaseForm = ({
  onClose,
  onSuccess,
  fechaAEditar,
  impuestoId,
}: CalendarioBaseFormProps) => {
  const [impuestoMeta, setImpuestoMeta] =
    useState<ImpuestoConEspecialista | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CalendarioBaseFormData>({
    resolver: zodResolver(calendarioBaseSchema),
    defaultValues: {
      anio: new Date().getFullYear(),
      impuesto_id: impuestoId,
    },
  });

  const isEditing = !!fechaAEditar;

  const requiereDigito = impuestoMeta?.regla_vencimiento !== "FECHA_FIJA";

  useEffect(() => {
    setValue("impuesto_id", impuestoId);

    setLoadingMeta(true);
    impuestosService
      .getAll()
      .then((data) => {
        const meta = data.find((i) => i.id === impuestoId);
        if (meta) setImpuestoMeta(meta);
      })
      .catch((err) => console.error("Error al recuperar metadatos:", err))
      .finally(() => setLoadingMeta(false));
  }, [impuestoId, setValue]);

  useEffect(() => {
    if (fechaAEditar) {
      reset({
        impuesto_id: impuestoId,
        anio: fechaAEditar.anio,
        periodo: fechaAEditar.periodo,
        digito: fechaAEditar.digito,
        fecha_vencimiento_oficial: fechaAEditar.fecha_vencimiento_oficial,
      });
    }
  }, [fechaAEditar, reset, impuestoId]);

  const onSubmit = async (data: CalendarioBaseFormData) => {
    try {
      const payload = { ...data, impuesto_id: impuestoId };

      if (isEditing && fechaAEditar) {
        await calendarioBaseService.update(fechaAEditar.id, payload);
      } else {
        await calendarioBaseService.create(payload);
      }
      onSuccess();
    } catch (error: any) {
      alert(error.message || "Error al guardar la fecha oficial");
    }
  };

  return (
    <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-gray-200">
        <div className="bg-primary p-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-surface">
            <CalendarDays className="w-5 h-5" />
            <h2 className="font-title font-semibold text-sm">
              {isEditing
                ? "Editar Fecha Oficial"
                : `Parametrizar Periodo — ${impuestoMeta?.nombre || ""}`}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-surface/70 hover:text-surface transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {loadingMeta ? (
          <div className="bg-surface p-12">
            <Loader
              texto="Sincronizando reglas fiscales..."
              fullScreen={false}
            />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-main mb-1">
                  Año Fiscal
                </label>
                <input
                  type="number"
                  {...register("anio", { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-accent outline-none text-sm"
                />
                {errors.anio && (
                  <p className="text-danger text-xs mt-1">
                    {errors.anio.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-main mb-1">
                  Periodo (Mes/Bim/Cuat)
                </label>
                <input
                  {...register("periodo")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-accent outline-none text-sm"
                  placeholder="Ej. 01, B1, ANUAL"
                />
                {errors.periodo && (
                  <p className="text-danger text-xs mt-1">
                    {errors.periodo.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-main mb-1">
                  Dígito NIT{" "}
                  {!requiereDigito && (
                    <span className="text-text-muted font-normal">(N/A)</span>
                  )}
                </label>
                <input
                  type="number"
                  {...register("digito", {
                    setValueAs: (v) =>
                      v === "" || v === null ? null : Number(v),
                  })}
                  disabled={!requiereDigito}
                  placeholder={requiereDigito ? "0-9" : "Fecha fija"}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-accent outline-none text-sm ${!requiereDigito ? "bg-gray-100 cursor-not-allowed" : "bg-surface border-gray-300"}`}
                />
                {errors.digito && (
                  <p className="text-danger text-xs mt-1">
                    {errors.digito.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-main mb-1">
                  Fecha Límite Oficial
                </label>
                <input
                  type="date"
                  {...register("fecha_vencimiento_oficial")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-accent outline-none text-sm"
                />
                {errors.fecha_vencimiento_oficial && (
                  <p className="text-danger text-xs mt-1">
                    {errors.fecha_vencimiento_oficial.message}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 mt-2">
              <p className="text-[11px] text-amber-800 leading-relaxed">
                <strong>Nota:</strong> Al guardar, el sistema actualizará
                dinámicamente el cronograma de todas las empresas vinculadas a
                este impuesto.
              </p>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-text-muted hover:bg-gray-100 rounded-md transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-accent hover:bg-accent/90 text-primary font-semibold px-6 py-2 rounded-md flex items-center gap-2 transition-all shadow-md disabled:opacity-70 text-sm"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? "Guardando..." : "Guardar Fecha"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
