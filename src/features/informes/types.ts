import { z } from "zod";

export const filtrosInformeSchema = z
  .object({
    fechaInicio: z.string().min(1, "La fecha de inicio es requerida."),
    fechaFin: z.string().min(1, "La fecha de fin es requerida."),
    usuarioId: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.fechaInicio || !data.fechaFin) return true;
      return new Date(data.fechaInicio) <= new Date(data.fechaFin);
    },
    {
      message: "La fecha de inicio no puede ser mayor a la fecha final.",
      path: ["fechaInicio"],
    },
  );

export type FiltrosInformeData = z.infer<typeof filtrosInformeSchema>;

export interface MetricaVencimientosEmpleado {
  usuario_id: string;
  nombre_completo: string;
  cargo: string;
  total_vencimientos: number;
  presentados_a_tiempo: number;
  presentados_tarde: number;
  pendientes: number;
  vencidos: number;
  porcentaje_efectividad: number;
}