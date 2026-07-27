import { useQuery } from "@tanstack/react-query";
import { informesService } from "./informesService";
import type { FiltrosInformeData } from "./types";

export const INFORMES_EMPLEADOS_KEY = "informes_empleados_vencimientos";
export const INFORMES_IMPUESTOS_KEY = "informes_impuestos_vencimientos";
export const INFORMES_DETALLE_EMPLEADO_KEY = "informes_detalle_empleado";

export const useInformesVencimientos = (filtros: FiltrosInformeData) => {
  return useQuery({
    queryKey: [INFORMES_EMPLEADOS_KEY, filtros],
    queryFn: () => informesService.getVencimientosPorEmpleado(filtros),
    staleTime: 1000 * 60 * 5,
  });
};

export const useInformesImpuestos = (filtros: FiltrosInformeData) => {
  return useQuery({
    queryKey: [INFORMES_IMPUESTOS_KEY, filtros],
    queryFn: () => informesService.getVencimientosPorImpuesto(filtros),
    staleTime: 1000 * 60 * 5,
  });
};

export const useDetalleInformeEmpleado = (
  usuarioId: string | undefined,
  fechaInicio: string,
  fechaFin: string,
) => {
  return useQuery({
    queryKey: [INFORMES_DETALLE_EMPLEADO_KEY, usuarioId, fechaInicio, fechaFin],
    queryFn: () =>
      informesService.getDetalleEmpleado(
        usuarioId || "",
        fechaInicio,
        fechaFin,
      ),
    enabled: !!usuarioId && !!fechaInicio && !!fechaFin,
    staleTime: 1000 * 60 * 5,
  });
};