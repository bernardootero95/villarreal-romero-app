import { supabase } from '../../lib/supabase';
import { usuariosService } from '../usuarios/usuariosService'; 

export interface Vencimiento {
  id: string;
  fecha_limite: string;
  periodo_fiscal: string;
  estado_tarea: 'PENDIENTE' | 'REVISIÓN' | 'PRESENTADO' | 'VENCIDO';
  observaciones: string | null;
  clientes: {
    id: string;
    razon_social: string;
    nit: string;
    dv: number;
    contador_id: string;
    estado?: string; 
  };
  impuestos: {
    id: string;
    nombre: string;
    especialista_id: string | null;
  };
}

export const vencimientosService = {
  async getVencimientosMes(anio: number, mes: number, usuarioId: string, cargo: string) {
    const startDate = new Date(anio, mes, 1).toISOString().split('T')[0];
    const endDate = new Date(anio, mes + 1, 0).toISOString().split('T')[0];

    
    const { data, error } = await supabase
      .from('vencimientos')
      .select(`
        id,
        fecha_limite,
        periodo_fiscal,
        estado_tarea,
        observaciones,
        clientes!inner ( id, razon_social, nit, dv, contador_id, estado ),
        impuestos ( id, nombre, especialista_id )
      `)
      .gte('fecha_limite', startDate)
      .lte('fecha_limite', endDate)
      .eq('clientes.estado', 'ACTIVO') 
      .order('fecha_limite', { ascending: true });

    if (error) throw error;

    const isAdmin = ['Gerente', 'Ingeniero'].includes(cargo);

    const vencimientosPermitidos = (data as any[]).filter(v => {
      if (isAdmin) return true;
      return v.clientes.contador_id === usuarioId || v.impuestos.especialista_id === usuarioId;
    });

    return vencimientosPermitidos as Vencimiento[];
  },

  
  async actualizarEstado(id: string, nuevoEstado: string, observaciones: string = '') {
    
    const { data: previo } = await supabase.from('vencimientos').select('*').eq('id', id).single();

    
    const { data, error } = await supabase
      .from('vencimientos')
      .update({ 
        estado_tarea: nuevoEstado, 
        observaciones: observaciones || null,
        actualizado: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    
    await usuariosService.registrarAuditoria('GESTIONAR_TAREA', 'VENCIMIENTOS', id, previo, data);
    return data;
  }
};