import { z } from 'zod';
import type { CamposBase } from '../usuarios/types';


export const ESTADOS_CLIENTE = [
  'ACTIVO',
  'INACTIVO',
] as const;


export const clienteSchema = z.object({
  nit: z.string()
    .min(5, 'El NIT es muy corto')
    .regex(/^[0-9]+$/, 'El NIT debe contener solo números (sin puntos ni guiones)'),
  
  
  dv: z.number()
    .min(0, 'El DV debe ser entre 0 y 9')
    .max(9, 'El DV debe ser entre 0 y 9'),
  
  razon_social: z.string().min(3, 'La Razón Social debe tener al menos 3 caracteres'),
  
  
  email: z.string()
    .email('Formato de correo inválido')
    .or(z.literal(''))
    .nullable()
    .optional(),
    
  
  celular: z.string()
    .regex(/^3[0-9]{9}$/, 'El celular debe tener 10 dígitos y empezar por 3')
    .or(z.literal(''))
    .nullable()
    .optional(),
    
  contador_id: z.string().uuid('Debes seleccionar un contador responsable'),
  
  
  estado: z.enum(ESTADOS_CLIENTE),
});


export type ClienteFormData = z.infer<typeof clienteSchema>;


export interface Cliente extends ClienteFormData, Omit<CamposBase, 'estado'> {
  id: string; // UUID generado por Supabase
}


export interface ClienteConContador extends Cliente {
  usuarios?: {
    nombre_completo: string;
  };
}