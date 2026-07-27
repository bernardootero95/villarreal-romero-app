import { useQuery } from "@tanstack/react-query";
import { informesService } from "./informesService";
import type { FiltrosInformeData } from "./types";

export const INFORMES_EMPLEADOS_KEY = "informes_empleados_vencimientos";

export const useInformesVencimientos = (filtros: FiltrosInformeData) => {
  return useQuery({
    queryKey: [INFORMES_EMPLEADOS_KEY, filtros],
    queryFn: () => informesService.getVencimientosPorEmpleado(filtros),
    staleTime: 1000 * 60 * 5, 
  });
};