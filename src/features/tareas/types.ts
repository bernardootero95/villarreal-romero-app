import { z } from "zod";
import type { CamposBase } from "../usuarios/types";

export const ESTADOS_TAREA = ["PENDIENTE", "EN_PROGRESO", "COMPLETADA"] as const;

export const tareaSchema = z.object({
  titulo: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  descripcion: z.string().optional(),
  fecha_limite: z.string().min(1, "La fecha límite es obligatoria"),
  usuario_id: z.string().uuid("Debes asignar la tarea a un usuario"),
  estado: z.enum(ESTADOS_TAREA).default("PENDIENTE"),
});

export type TareaFormData = z.infer<typeof tareaSchema>;

export interface Tarea extends TareaFormData, Omit<CamposBase, 'estado'> {
  id: string;
  usuarios?: {
    nombre_completo: string;
  };
}