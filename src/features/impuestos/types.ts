import { z } from 'zod';
import type { CamposBase } from '../usuarios/types';

// 1. Constantes de Dominio (Reglas de Negocio)
export const PERIODICIDADES = [
  'MENSUAL',
  'BIMESTRAL',
  'CUATRIMESTRAL',
  'SEMESTRAL',
  'ANUAL',
  'FECHA_FIJA'
] as const;

export const REGLAS_VENCIMIENTO = [
  'ULTIMO_DIGITO',
  'DOS_ULTIMOS_DIGITOS',
  'FECHA_FIJA'
] as const;

export const ESTADOS_IMPUESTO = ['ACTIVO', 'INACTIVO'] as const;

// 2. Esquema Zod
export const impuestoSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  
  // MODIFICACIÓN: Uso de { message } en lugar de errorMap
  periodicidad: z.enum(PERIODICIDADES, { message: 'Periodicidad inválida' }),
  
  // MODIFICACIÓN: Uso de { message } en lugar de errorMap
  regla_vencimiento: z.enum(REGLAS_VENCIMIENTO, { message: 'Regla inválida' }),
  
  // MODIFICACIÓN: Agregamos nullable() para consistencia con los IDs vacíos hacia Supabase
  especialista_id: z.string().uuid('ID de especialista inválido').or(z.literal('')).nullable().optional(),
  
  // MODIFICACIÓN: Quitamos .default() para que TypeScript lo infiera como requerido en el Form
  estado: z.enum(ESTADOS_IMPUESTO),
});

// 3. Tipos Inferidos
export type ImpuestoFormData = z.infer<typeof impuestoSchema>;

// 4. Interfaces de Base de Datos
export interface Impuesto extends ImpuestoFormData, Omit<CamposBase, 'estado'> {
  id: string;
}

export interface ImpuestoConEspecialista extends Impuesto {
  usuarios?: {
    nombre_completo: string;
  };
}