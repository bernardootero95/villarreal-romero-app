import { z } from 'zod';
import type { CamposBase } from '../usuarios/types';


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


export const impuestoSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  
  
  periodicidad: z.enum(PERIODICIDADES, { message: 'Periodicidad inválida' }),
  
  
  regla_vencimiento: z.enum(REGLAS_VENCIMIENTO, { message: 'Regla inválida' }),
  
  
  especialista_id: z.string().uuid('ID de especialista inválido').or(z.literal('')).nullable().optional(),
  
  
  estado: z.enum(ESTADOS_IMPUESTO),
});


export type ImpuestoFormData = z.infer<typeof impuestoSchema>;


export interface Impuesto extends ImpuestoFormData, Omit<CamposBase, 'estado'> {
  id: string;
}

export interface ImpuestoConEspecialista extends Impuesto {
  usuarios?: {
    nombre_completo: string;
  };
}