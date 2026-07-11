import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vencimientosService, type Vencimiento } from "./vencimientosService";

export const getVencimientosQueryKey = (anio: number, mes: number, usuarioId: string) => 
  ["vencimientos", anio, mes, usuarioId] as const;

export const useVencimientosMes = (
  anio: number,
  mes: number,
  usuarioId: string | undefined,
  cargo: string | undefined
) => {
  return useQuery<Vencimiento[], Error>({
    queryKey: getVencimientosQueryKey(anio, mes, usuarioId || ""),
    queryFn: () => vencimientosService.getVencimientosMes(anio, mes, usuarioId!, cargo!),
    enabled: !!usuarioId && !!cargo,
    staleTime: 1000 * 60 * 5, 
  });
};

interface ParamsActualizarEstado {
  id: string;
  nuevoEstado: 'PENDIENTE' | 'REVISIÓN' | 'PRESENTADO' | 'VENCIDO';
  observaciones?: string;
  anio: number;
  mes: number;
  usuarioId: string;
}

export const useActualizarEstadoVencimiento = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, nuevoEstado, observaciones }: ParamsActualizarEstado) =>
      vencimientosService.actualizarEstado(id, nuevoEstado, observaciones || ""),
    
    onMutate: async (variables) => {
      const queryKey = getVencimientosQueryKey(variables.anio, variables.mes, variables.usuarioId);

      await queryClient.cancelQueries({ queryKey });

      const vencimientosPrevios = queryClient.getQueryData<Vencimiento[]>(queryKey);

      if (vencimientosPrevios) {
        queryClient.setQueryData<Vencimiento[]>(
          queryKey,
          vencimientosPrevios.map((vto) =>
            vto.id === variables.id
              ? { ...vto, estado_tarea: variables.nuevoEstado, observaciones: variables.observaciones || null }
              : vto
          )
        );
      }

      return { vencimientosPrevios, queryKey };
    },

    onError: (_err, _variables, context) => {
      if (context?.vencimientosPrevios) {
        queryClient.setQueryData(context.queryKey, context.vencimientosPrevios);
      }
    },

    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: getVencimientosQueryKey(variables.anio, variables.mes, variables.usuarioId),
      });
    },
  });
};