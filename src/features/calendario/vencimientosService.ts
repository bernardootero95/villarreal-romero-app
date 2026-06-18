import { supabase } from '../../lib/supabase';

// Tipos inferidos de nuestra base de datos
export interface Vencimiento {
  id: string;
  fecha_limite: string;
  periodo_fiscal: string;
  estado_tarea: 'PENDIENTE' | 'REVISIÓN' | 'PRESENTADO' | 'VENCIDO';
  clientes: {
    id: string;
    razon_social: string;
    nit: string;
    dv: number;
    contador_id: string;
  };
  impuestos: {
    id: string;
    nombre: string;
    especialista_id: string | null;
  };
}

export const vencimientosService = {
  // Obtener los vencimientos de un mes específico
  async getVencimientosMes(anio: number, mes: number, usuarioId: string, cargo: string) {
    // Definimos el inicio y fin del mes para la consulta SQL
    const startDate = new Date(anio, mes, 1).toISOString().split('T')[0];
    const endDate = new Date(anio, mes + 1, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('vencimientos')
      .select(`
        id,
        fecha_limite,
        periodo_fiscal,
        estado_tarea,
        clientes ( id, razon_social, nit, dv, contador_id ),
        impuestos ( id, nombre, especialista_id )
      `)
      .gte('fecha_limite', startDate)
      .lte('fecha_limite', endDate)
      .order('fecha_limite', { ascending: true });

    if (error) throw error;

    const isAdmin = ['Gerente', 'Ingeniero'].includes(cargo);

    // Filtramos en el cliente por seguridad de roles
    const vencimientosPermitidos = (data as any[]).filter(v => {
      if (isAdmin) return true;
      // Si soy el contador de la empresa, o soy el especialista de ese impuesto
      return v.clientes.contador_id === usuarioId || v.impuestos.especialista_id === usuarioId;
    });

    return vencimientosPermitidos as Vencimiento[];
  }
};