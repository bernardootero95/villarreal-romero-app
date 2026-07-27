import { z } from "zod";

export const filtrosInformeSchema = z
  .object({
    fechaInicio: z.string().min(1, "La fecha de inicio es requerida."),
    fechaFin: z.string().min(1, "La fecha de fin es requerida."),
    usuarioId: z.string().optional(),
    impuestoId: z.string().optional(),
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

export interface MetricaVencimientosImpuesto {
  impuesto_id: string;
  nombre: string;
  periodicidad: string;
  total_vencimientos: number;
  presentados_a_tiempo: number;
  presentados_tarde: number;
  pendientes: number;
  vencidos: number;
  porcentaje_efectividad: number;
}

export type ClasificacionVencimiento =
  | "A_TIEMPO"
  | "TARDE"
  | "PENDIENTE"
  | "VENCIDO";

export interface DetalleVencimientoEmpleado {
  id: string;
  razon_social: string;
  nit: string;
  dv: number;
  impuesto_nombre: string;
  periodo_fiscal: string;
  fecha_limite: string;
  estado_tarea: string;
  fecha_radicacion: string | null;
  observaciones: string | null;
  clasificacion: ClasificacionVencimiento;
}

export interface ResumenDetalleEmpleado {
  usuario: {
    id: string;
    nombre_completo: string;
    cargo: string;
  };
  metricas: {
    total: number;
    a_tiempo: number;
    tarde: number;
    pendientes: number;
    vencidos: number;
    efectividad: number;
  };
  items: DetalleVencimientoEmpleado[];
}

export interface DetalleVencimientoImpuesto {
  id: string;
  razon_social: string;
  nit: string;
  dv: number;
  contador_nombre: string;
  periodo_fiscal: string;
  fecha_limite: string;
  estado_tarea: string;
  fecha_radicacion: string | null;
  observaciones: string | null;
  clasificacion: ClasificacionVencimiento;
}

export interface ResumenDetalleImpuesto {
  impuesto: {
    id: string;
    nombre: string;
    periodicidad: string;
  };
  metricas: {
    total: number;
    a_tiempo: number;
    tarde: number;
    pendientes: number;
    vencidos: number;
    efectividad: number;
  };
  items: DetalleVencimientoImpuesto[];
}