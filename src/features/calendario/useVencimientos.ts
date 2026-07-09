// src/features/calendario/useVencimientos.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vencimientosService, type Vencimiento } from "./vencimientosService";

// Función para generar una query key estructurada
export const getVencimientosQueryKey = (anio: number, mes: number, usuarioId: string) => 
  ["vencimientos", anio, mes, usuarioId] as const;

/**
 * Hook declarativo para obtener los vencimientos de un mes y año específicos
 */
export const useVencimientosMes = (
  anio: number,
  mes: number,
  usuarioId: string | undefined,
  cargo: string | undefined
) => {
  return useQuery<Vencimiento[], Error>({
    queryKey: getVencimientosQueryKey(anio, mes, usuarioId || ""),
    queryFn: () => vencimientosService.getVencimientosMes(anio, mes, usuarioId!, cargo!),
    enabled: !!usuarioId && !!cargo, // No se ejecuta la consulta hasta que el perfil esté cargado
    staleTime: 1000 * 60 * 2, // Considerar frescos por 2 minutos
  });
};

interface ParamsActualizarEstado {
  id: string;
  nuevoEstado: string;
  observaciones?: string;
  // Parámetros necesarios para invalidar la caché correcta tras el éxito
  anio: number;
  mes: number;
  usuarioId: string;
}

/**
 * Hook para mutar y actualizar el estado de una obligación tributaria
 */
export const useActualizarEstadoVencimiento = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, nuevoEstado, observaciones }: ParamsActualizarEstado) =>
      vencimientosService.actualizarEstado(id, nuevoEstado, observaciones),
    onSuccess: (_data, variables) => {
      // Invalidar únicamente la caché del mes y usuario que sufrieron el cambio
      queryClient.invalidateQueries({
        queryKey: getVencimientosQueryKey(variables.anio, variables.mes, variables.usuarioId),
      });
    },
  });
};