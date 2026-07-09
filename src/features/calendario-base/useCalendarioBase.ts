import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { calendarioBaseService } from "./calendarioBaseService";
import type { CalendarioBaseConImpuesto, CalendarioBaseFormData } from "./types";


export const CALENDARIO_BASE_KEY = ["calendario-base"] as const;

export const getCalendarioBaseQueryKey = (anio: number) => [...CALENDARIO_BASE_KEY, anio] as const;

export const useCalendarioBase = (anio: number) => {
  return useQuery<CalendarioBaseConImpuesto[], Error>({
    queryKey: getCalendarioBaseQueryKey(anio),
    queryFn: () => calendarioBaseService.getAll(anio),
    staleTime: 1000 * 60 * 10, // Los vencimientos oficiales varían poco, los consideramos frescos por 10 min
  });
};

export const useCreateCalendarioBase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: CalendarioBaseFormData) => calendarioBaseService.create(formData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: getCalendarioBaseQueryKey(data.anio) });
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: getCalendarioBaseQueryKey(data.anio) });
    },
  });
};

interface MutateDeleteParams {
  id: string;
  anio: number;
}

export const useDeleteCalendarioBase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: MutateDeleteParams) => calendarioBaseService.delete(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: getCalendarioBaseQueryKey(variables.anio) });
    },
  });
};

export const useCreateBulkCalendarioBase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ registros }: { registros: CalendarioBaseFormData[]; anio: number }) => 
      calendarioBaseService.createBulk(registros),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: getCalendarioBaseQueryKey(variables.anio) });
    },
  });
};