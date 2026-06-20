import { z } from "zod";

// 1. Constantes de Dominio
export const CARGOS_PERMITIDOS = [
  "Gerente",
  "Contador",
  "Auxiliar",
  "Asistente",
  "Ingeniero",
  "Practicante",
] as const;

export const ESTADOS_USUARIO = ["ACTIVO", "INACTIVO", "SUSPENDIDO"] as const;

// 2. Esquema de validación con Zod para el formulario
export const usuarioSchema = z.object({
  username: z
    .string()
    .min(4, "El usuario debe tener al menos 4 caracteres")
    .regex(
      /^[a-zA-Z0-9_.]+$/,
      "Solo letras, números, puntos y guiones bajos (sin espacios)",
    ),
  
  // MODIFICACIÓN: Agregamos .nullable()
  email: z
    .string()
    .email("Formato de correo inválido")
    .or(z.literal(""))
    .nullable()
    .optional(),
    
  // MODIFICACIÓN: Agregamos .nullable()
  correo_notificacion: z
    .string()
    .email("Formato de correo de notificación inválido")
    .or(z.literal(""))
    .nullable()
    .optional(),
    
  nombre_completo: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres"),
    
  // MODIFICACIÓN: Sintaxis correcta para mensajes de error en Zod enum
  cargo: z.enum(CARGOS_PERMITIDOS, {
    required_error: "Debes seleccionar un cargo",
    invalid_type_error: "Debes seleccionar un cargo válido",
  }),
  
  // MODIFICACIÓN: Quitamos .default() para que TypeScript lo infiera como requerido
  estado: z.enum(ESTADOS_USUARIO),
});

// 3. Tipos inferidos de Zod (Ahora incluye automáticamente correo_notificacion)
export type UsuarioFormData = z.infer<typeof usuarioSchema>;

// 4. Interfaz Base para TODAS las tablas del sistema
export interface CamposBase {
  estado: string;
  creado: string;
  actualizado: string | null;
  eliminado: string | null; // Timestamps para Soft Delete
}

// 5. Interfaces de Base de Datos (Ya hereda correo_notificacion mediante UsuarioFormData)
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