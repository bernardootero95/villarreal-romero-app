import { z } from "zod";

export const CARGOS_PERMITIDOS = [
  "Gerente",
  "Contador",
  "Auxiliar",
  "Asistente",
  "Ingeniero",
  "Practicante",
] as const;

export const usuarioSchema = z.object({
  nombre_completo: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres"),
  email: z.string().email("Formato de correo electrónico inválido"),
  cargo: z.enum(CARGOS_PERMITIDOS, {
    errorMap: () => ({ message: "Debes seleccionar un cargo válido" }),
  }),
  activo: z.boolean().default(true),
});

export type UsuarioFormData = z.infer<typeof usuarioSchema>;

export interface Usuario extends UsuarioFormData {
  id: string; // UUID proveniente de Supabase Auth
  creado_en: string;
}

export interface RegistroAuditoria {
  id: string;
  usuario_id: string;
  accion: "CREAR" | "MODIFICAR" | "ELIMINAR";
  modulo: string;
  registro_id: string;
  datos_previos: Record<string, unknown> | null;
  datos_nuevos: Record<string, unknown> | null;
  fecha: string;
}
