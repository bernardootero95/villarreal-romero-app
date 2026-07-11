import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  clienteSchema,
  type ClienteFormData,
  type ClienteConContador,
} from "./types";
import { X, Save, Building2, ArrowRight } from "lucide-react";
import { useCreateCliente, useUpdateCliente } from "./useClientes";
import { usuariosService } from "../usuarios/usuariosService";
import type { Usuario } from "../usuarios/types";
import { FichaObligaciones } from "./FichaObligaciones";
import { AlertNotification } from "../../components/ui/AlertNotification";

interface ClienteFormProps {
  onClose: () => void;
  onSuccess: () => void;
  clienteAEditar?: ClienteConContador | null;
}

const calcularDV = (nit: string): number | null => {
  if (!nit || !/^[0-9]+$/.test(nit)) return null;
  const vpri = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  let x = 0;
  let y = 0;
  const z = nit.length;
  for (let i = 0; i < z; i++) {
    y = parseInt(nit.charAt(i), 10);
    x += y * vpri[z - 1 - i];
  }
  const y1 = x % 11;
  return y1 > 1 ? 11 - y1 : y1;
};

export const ClienteForm = ({
  onClose,
  onSuccess,
  clienteAEditar,
}: ClienteFormProps) => {
  const [contadores, setContadores] = useState<Usuario[]>([]);
  const [loadingContadores, setLoadingContadores] = useState(true);
  const [clienteCreado, setClienteCreado] = useState<ClienteConContador | null>(
    null,
  );
  const [mostrarPasoObligaciones, setMostrarPasoObligaciones] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Inyección de mutaciones controladas por TanStack Query
  const createClienteMutation = useCreateCliente();
  const updateClienteMutation = useUpdateCliente();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: { estado: "ACTIVO" },
  });

  useEffect(() => {
    if (clienteAEditar) {
      reset({
        nit: clienteAEditar.nit,
        dv: clienteAEditar.dv,
        razon_social: clienteAEditar.razon_social,
        email: clienteAEditar.email || "",
        celular: clienteAEditar.celular || "",
        contador_id: clienteAEditar.contador_id,
        estado: clienteAEditar.estado as "ACTIVO" | "INACTIVO",
      });
    }
  }, [clienteAEditar, reset]);

  const nitValue = watch("nit");

  useEffect(() => {
    if (nitValue && /^[0-9]+$/.test(nitValue)) {
      const dv = calcularDV(nitValue);
      if (dv !== null) {
        setValue("dv", dv, { shouldValidate: true });
      }
    } else {
      setValue("dv", 0, { shouldValidate: false });
    }
  }, [nitValue, setValue]);

  useEffect(() => {
    const cargarContadores = async () => {
      try {
        const data = await usuariosService.getAll();
        const contadoresValidos = data.filter((u) => u.estado === "ACTIVO");
        setContadores(contadoresValidos);
      } catch (error) {
        console.error("Error cargando responsables:", error);
      } finally {
        setLoadingContadores(false);
      }
    };
    cargarContadores();
  }, []);

  const onSubmit = async (data: ClienteFormData) => {
    setSubmitError(null);
    const datosLimpios = {
      ...data,
      email: data.email?.trim() || null,
      celular: data.celular?.trim() || null,
    };

    if (clienteAEditar) {
      updateClienteMutation.mutate(
        { id: clienteAEditar.id, payload: datosLimpios },
        {
          onSuccess: () => onSuccess(),
          onError: (err: any) =>
            setSubmitError(err.message || "Fallo al actualizar el cliente."),
        },
      );
    } else {
      createClienteMutation.mutate(datosLimpios, {
        onSuccess: (nuevoCliente) => {
          if (nuevoCliente) {
            setClienteCreado(nuevoCliente as ClienteConContador);
            setMostrarPasoObligaciones(true);
          } else {
            onSuccess();
          }
        },
        onError: (err: any) =>
          setSubmitError(err.message || "No se pudo registrar el cliente."),
      });
    }
  };

  const isEditing = !!clienteAEditar;
  const isSubmitting =
    createClienteMutation.isPending || updateClienteMutation.isPending;

  if (mostrarPasoObligaciones && clienteCreado) {
    return (
      <FichaObligaciones cliente={clienteCreado} onClose={() => onSuccess()} />
    );
  }

  return (
    <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden border border-gray-200">
        <div className="bg-primary p-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-surface">
            <Building2 className="w-5 h-5" />
            <h2 className="font-title font-semibold">
              {isEditing ? "Editar Cliente" : "Registrar Cliente — Paso 1 de 2"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-surface/70 hover:text-surface transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {submitError && (
            <div className="animate-in fade-in duration-200">
              <AlertNotification
                type="error"
                title="Error de Registro"
                message={submitError}
                onClose={() => setSubmitError(null)}
              />
            </div>
          )}

          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-9 md:col-span-10">
              <label className="block text-sm font-medium text-text-main mb-1">
                NIT
              </label>
              <input
                {...register("nit")}
                disabled={isEditing}
                className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-accent outline-none data-code bg-surface ${
                  errors.nit ? "border-danger" : "border-gray-300"
                } ${isEditing ? "bg-gray-100 cursor-not-allowed" : ""}`}
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
                {...register("dv", { valueAsNumber: true })}
                type="number"
                readOnly
                className={`w-full px-3 py-2 border rounded-md outline-none data-code text-center bg-gray-100 cursor-not-allowed ${
                  errors.dv ? "border-danger" : "border-gray-300"
                }`}
                placeholder="-"
              />
              <p className="text-[10px] text-text-muted mt-1 text-center">
                Calculado
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-main mb-1">
              Razón Social / Nombre
            </label>
            <input
              {...register("razon_social")}
              className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-accent outline-none bg-surface ${
                errors.razon_social ? "border-danger" : "border-gray-300"
              }`}
              placeholder="Nombre de la empresa o persona natural"
            />
            {errors.razon_social && (
              <p className="text-danger text-xs mt-1">
                {errors.razon_social.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-main mb-1">
                Email de Contacto{" "}
                <span className="text-text-muted font-normal text-xs">
                  (Opcional)
                </span>
              </label>
              <input
                {...register("email")}
                className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-accent outline-none bg-surface ${
                  errors.email ? "border-danger" : "border-gray-300"
                }`}
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
                Número de Celular{" "}
                <span className="text-text-muted font-normal text-xs">
                  (Opcional)
                </span>
              </label>
              <input
                {...register("celular")}
                className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-accent outline-none data-code bg-surface ${
                  errors.celular ? "border-danger" : "border-gray-300"
                }`}
                placeholder="Ej. 3151234567"
              />
              {errors.celular && (
                <p className="text-danger text-xs mt-1">
                  {errors.celular.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-main mb-1">
              Responsable Asignado
            </label>
            <select
              {...register("contador_id")}
              disabled={loadingContadores}
              className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-accent outline-none bg-surface ${
                errors.contador_id ? "border-danger" : "border-gray-300"
              }`}
            >
              <option value="">Seleccione un responsable...</option>
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

          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-text-muted hover:bg-gray-100 rounded-md transition-colors text-sm font-medium cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-accent hover:bg-accent/90 text-primary font-semibold px-6 py-2 rounded-md flex items-center gap-2 transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed text-sm cursor-pointer"
            >
              {isSubmitting ? (
                "Guardando..."
              ) : isEditing ? (
                <>
                  <Save className="w-4 h-4" /> Actualizar Cliente
                </>
              ) : (
                <>
                  Continuar a Impuestos <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
