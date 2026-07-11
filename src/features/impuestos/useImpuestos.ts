import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { impuestosService } from "./impuestosService";
import type { ImpuestoConEspecialista } from "./types";

// Clave única estructural para segmentar el dominio de impuestos en la caché global
export const IMPUESTOS_QUERY_KEY = ["impuestos"] as const;

export const getImpuestosQueryKey = () => IMPUESTOS_QUERY_KEY;

/**
 * Hook declarativo para jalar el catálogo completo de obligaciones de la firma
 */
export const useImpuestos = () => {
  return useQuery<ImpuestoConEspecialista[], Error>({
    queryKey: getImpuestosQueryKey(),
    queryFn: impuestosService.getAll,
    staleTime: 1000 * 60 * 10, // Consideramos las reglas de impuestos estables por 10 minutos
  });
};

/**
 * Hook para la desactivación lógica y persistencia en caliente de un impuesto
 */
export const useDesactivarImpuesto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => impuestosService.delete(id),
    onSuccess: () => {
      // Forzar refresco silencioso en segundo plano de todos los listados dependientes
      queryClient.invalidateQueries({ queryKey: getImpuestosQueryKey() });
      // Invalida opcionalmente los dashboards operativos para actualizar analíticas
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};