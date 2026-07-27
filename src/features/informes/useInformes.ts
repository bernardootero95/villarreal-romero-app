import { useQuery } from "@tanstack/react-query";
import { informesService } from "./informesService";
import type { FiltrosInformeData } from "./types";

export const INFORMES_CLIENTES_KEY = "informes_clientes";
export const INFORMES_EQUIPO_KEY = "informes_equipo";

export const useInformeCumplimiento = (filtros: FiltrosInformeData) => {
  return useQuery({
    queryKey: [INFORMES_CLIENTES_KEY, filtros],
    queryFn: () => informesService.getCumplimientoClientes(filtros),
    staleTime: 1000 * 60 * 5, // 5 minutos de datos frescos
  });
};

export const useInformeCargaEquipo = (filtros: FiltrosInformeData) => {
  return useQuery({
    queryKey: [INFORMES_EQUIPO_KEY, filtros],
    queryFn: () => informesService.getCargaEquipo(filtros),
    staleTime: 1000 * 60 * 5,
  });
};