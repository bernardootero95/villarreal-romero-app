import { z } from "zod";


export const CARGOS_PERMITIDOS = [
  "Gerente",
  "Contador",
  "Auxiliar",
  "Asistente",
  "Ingeniero",
  "Practicante",
] as const;

export const ESTADOS_USUARIO = ["ACTIVO", "INACTIVO", "SUSPENDIDO"] as const;


export const usuarioSchema = z.object({
  username: z
    .string()
    .min(4, "El usuario debe tener al menos 4 caracteres")
    .regex(
      /^[a-zA-Z0-9_.]+$/,
      "Solo letras, números, puntos y guiones bajos (sin espacios)",
    ),
  
  email: z
    .string()
    .email("Formato de correo inválido")
    .or(z.literal(""))
    .nullable()
    .optional(),
    
  correo_notificacion: z
    .string()
    .email("Formato de correo de notificación inválido")
    .or(z.literal(""))
    .nullable()
    .optional(),
    
  nombre_completo: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres"),
    
  
  cargo: z.enum(CARGOS_PERMITIDOS, {
    message: "Debes seleccionar un cargo válido",
  }),
  
  estado: z.enum(ESTADOS_USUARIO),
});


export type UsuarioFormData = z.infer<typeof usuarioSchema>;


export interface CamposBase {
  estado: string;
  creado: string;
  actualizado: string | null;
  eliminado: string | null; 
}


export interface Usuario extends UsuarioFormData, Omit<CamposBase, 'estado'> {
  id: string; // UUID proveniente de Supabase Auth
}

export interface RegistroAuditoria extends CamposBase {
  id: string;
  usuario_id: string;
  accion: "CREAR" | "MODIFICAR" | "ELIMINAR";
  modulo: string;
  registro_id: string;
  datos_previos: Record<string, unknown> | null;
  datos_nuevos: Record<string, unknown> | null;
}