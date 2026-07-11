import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "./dashboardService";

export const DASHBOARD_METRICAS_KEY = ["dashboard", "metricas"] as const;
export const DASHBOARD_DISTRIBUCION_KEY = ["dashboard", "distribucion-impuestos"] as const;

/**
 * Hook para obtener las métricas de control operativo consolidado del contador/gerente
 */
export const useDashboardMetricas = (usuarioId: string | undefined, cargo: string | undefined) => {
  return useQuery({
    queryKey: [...DASHBOARD_METRICAS_KEY, usuarioId, cargo],
    queryFn: () => dashboardService.getMetricasContador(usuarioId!, cargo!),
    enabled: !!usuarioId && !!cargo,
    staleTime: 1000 * 60 * 3, // Las métricas del panel se mantienen frescas por 3 minutos
  });
};

/**
 * Hook analítico exclusivo para el rol Ingeniero/Gerente para mapear el catálogo vs asignaciones
 */
export const useDashboardDistribucion = (enabled: boolean) => {
  return useQuery({
    queryKey: DASHBOARD_DISTRIBUCION_KEY,
    queryFn: dashboardService.getDistribucionImpuestos,
    enabled: enabled,
    staleTime: 1000 * 60 * 5, // Frecuencia de actualización de 5 minutos
  });
};