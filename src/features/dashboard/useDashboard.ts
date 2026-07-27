import { useQuery } from "@tanstack/react-query";
import { dashboardService, type ModoVistaDashboard } from "./dashboardService";

export const DASHBOARD_METRICAS_KEY = ["dashboard", "metricas"] as const;
export const DASHBOARD_DISTRIBUCION_KEY = [
  "dashboard",
  "distribucion-impuestos",
] as const;


export const useDashboardMetricas = (
  usuarioId: string | undefined,
  cargo: string | undefined,
  vista: ModoVistaDashboard = "PERSONAL"
) => {
  return useQuery({
    queryKey: [...DASHBOARD_METRICAS_KEY, usuarioId, cargo, vista],
    queryFn: () =>
      dashboardService.getMetricasContador(usuarioId!, cargo!, vista),
    enabled: !!usuarioId && !!cargo,
    staleTime: 1000 * 60 * 3, // 3 minutos de datos frescos en caché
  });
};

export const useDashboardDistribucion = (enabled: boolean) => {
  return useQuery({
    queryKey: DASHBOARD_DISTRIBUCION_KEY,
    queryFn: dashboardService.getDistribucionImpuestos,
    enabled: enabled,
    staleTime: 1000 * 60 * 5,
  });
};