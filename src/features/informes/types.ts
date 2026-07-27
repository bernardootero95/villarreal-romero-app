import { z } from "zod";

export const filtrosInformeSchema = z
  .object({
    fechaInicio: z.string().min(1, "La fecha de inicio es requerida."),
    fechaFin: z.string().min(1, "La fecha de fin es requerida."),
    clienteId: z.string().optional(),
    usuarioId: z.string().optional(),
    estado: z.string().optional(),
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

export interface MetricaCumplimientoCliente {
  cliente_id: string;
  razon_social: string;
  nit: string;
  total_vencimientos: number;
  presentados: number;
  pendientes: number;
  vencidos: number;
  porcentaje_cumplimiento: number;
}

export interface MetricaCargaEquipo {
  usuario_id: string;
  nombre_completo: string;
  cargo: string;
  tareas_pendientes: number;
  tareas_completadas: number;
  tareas_vencidas: number;
  vencimientos_asignados: number;
}