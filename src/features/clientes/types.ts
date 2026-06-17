import { z } from 'zod';
import type { CamposBase } from '../usuarios/types';

// 1. Constantes de Dominio
export const ESTADOS_CLIENTE = [
  'ACTIVO',
  'INACTIVO',
] as const;

// 2. Esquema de validación con Zod para el formulario
export const clienteSchema = z.object({
  nit: z.string()
    .min(5, 'El NIT es muy corto')
    .regex(/^[0-9]+$/, 'El NIT debe contener solo números (sin puntos ni guiones)'),
  dv: z.coerce.number()
    .min(0, 'El DV debe ser entre 0 y 9')
    .max(9, 'El DV debe ser entre 0 y 9'),
  razon_social: z.string().min(3, 'La Razón Social debe tener al menos 3 caracteres'),
  email: z.string().email('Formato de correo inválido'),
  celular: z.string()
    .min(10, 'El celular debe tener 10 dígitos')
    .max(10, 'El celular debe tener 10 dígitos')
    .regex(/^3[0-9]{9}$/, 'El celular debe ser válido (10 dígitos y empezar por 3)'), // Validación específica para Colombia
  contador_id: z.string().uuid('Debes seleccionar un contador responsable'),
  estado: z.enum(ESTADOS_CLIENTE).default('ACTIVO'),
});

// 3. Tipos inferidos de Zod
export type ClienteFormData = z.infer<typeof clienteSchema>;

// 4. Interfaz de Base de Datos
export interface Cliente extends ClienteFormData, CamposBase {
  id: string; // UUID generado por Supabase
}

// 5. Interfaz extendida para mostrar el nombre del contador en la tabla
export interface ClienteConContador extends Cliente {
  usuarios?: {
    nombre_completo: string;
  };
}