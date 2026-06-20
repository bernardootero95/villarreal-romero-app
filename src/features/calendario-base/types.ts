import { z } from 'zod';

// 1. Esquema de validación con Zod
export const calendarioBaseSchema = z.object({
  impuesto_id: z.string().uuid('Debes seleccionar un impuesto'),
  
  // React Hook Form ya lo envía como número, por lo que usamos z.number() puro
  anio: z.number()
    .min(2024, 'El año debe ser válido')
    .max(2050, 'Año fuera de rango'),
    
  periodo: z.string()
    .min(1, 'El periodo es obligatorio (Ej. 01, B1, S1, ANUAL)'),
  
  // El dígito puede ser vacío/nulo para impuestos de Fecha Fija
  digito: z.number()
    .min(0, 'El dígito no puede ser negativo')
    .max(99, 'El dígito no puede ser mayor a 99')
    .nullable()
    .optional(),
    
  fecha_vencimiento_oficial: z.string().min(1, 'La fecha es obligatoria'),
});

// 2. Tipos inferidos
export type CalendarioBaseFormData = z.infer<typeof calendarioBaseSchema>;

// 3. Interfaz de Base de Datos
export interface CalendarioBase extends CalendarioBaseFormData {
  id: string;
  creado: string;
  actualizado: string;
}

// 4. Interfaz extendida para la tabla
export interface CalendarioBaseConImpuesto extends CalendarioBase {
  impuestos?: {
    nombre: string;
    periodicidad: string;
    regla_vencimiento: string;
  };
}