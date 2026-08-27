import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { calendarioBaseService } from "./calendarioBaseService";
import type { CalendarioBaseConImpuesto, CalendarioBaseFormData } from "./types";

export const CALENDARIO_BASE_KEY = ["calendario-base"] as const;

export const getCalendarioBaseQueryKey = (anio: number) => [...CALENDARIO_BASE_KEY, anio] as const;

export const useCalendarioBase = (anio: number) => {
  return useQuery<CalendarioBaseConImpuesto[], Error>({
    queryKey: getCalendarioBaseQueryKey(anio),
    queryFn: () => calendarioBaseService.getAll(anio),
    staleTime: 1000 * 60 * 10,
  });
};

export const useCreateCalendarioBase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: CalendarioBaseFormData) => calendarioBaseService.create(formData),
    onSuccess: () => {
      // Invalida el prefijo completo (todos los años en caché), no solo el año del
      // registro creado/editado: si al editar cambia el campo "anio", el año que el
      // usuario tenía abierto en pantalla también debe refrescarse.
      queryClient.invalidateQueries({ queryKey: CALENDARIO_BASE_KEY });
    },
  });
};

interface MutateUpdateParams {
  id: string;
  payload: CalendarioBaseFormData;
}

export const useUpdateCalendarioBase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: MutateUpdateParams) => calendarioBaseService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CALENDARIO_BASE_KEY });
    },
  });
};

export const useDeleteCalendarioBase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string }) => calendarioBaseService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CALENDARIO_BASE_KEY });
    },
  });
};

export const useCreateBulkCalendarioBase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ registros }: { registros: CalendarioBaseFormData[]; anio: number }) =>
      calendarioBaseService.createBulk(registros),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CALENDARIO_BASE_KEY });
    },
  });
};