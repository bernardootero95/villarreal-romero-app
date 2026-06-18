import { supabase } from '../../lib/supabase';
import { usuariosService } from '../usuarios/usuariosService'; // <-- Importamos para la auditoría

export interface Vencimiento {
  id: string;
  fecha_limite: string;
  periodo_fiscal: string;
  estado_tarea: 'PENDIENTE' | 'REVISIÓN' | 'PRESENTADO' | 'VENCIDO';
  observaciones: string | null; // <-- Aseguramos el campo observaciones
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
        clientes ( id, razon_social, nit, dv, contador_id ),
        impuestos ( id, nombre, especialista_id )
      `)
      .gte('fecha_limite', startDate)
      .lte('fecha_limite', endDate)
      .order('fecha_limite', { ascending: true });

    if (error) throw error;

    const isAdmin = ['Gerente', 'Ingeniero'].includes(cargo);

    const vencimientosPermitidos = (data as any[]).filter(v => {
      if (isAdmin) return true;
      return v.clientes.contador_id === usuarioId || v.impuestos.especialista_id === usuarioId;
    });

    return vencimientosPermitidos as Vencimiento[];
  },

  // NUEVO MÉTODO: CAMBIAR ESTADO DE LA OBLIGACIÓN
  async actualizarEstado(id: string, nuevoEstado: string, observaciones: string = '') {
    // A. Capturar estado previo para auditoría
    const { data: previo } = await supabase.from('vencimientos').select('*').eq('id', id).single();

    // B. Realizar la actualización en Supabase
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

    // C. Registrar auditoría con el radicado u observaciones adjuntas
    await usuariosService.registrarAuditoria('GESTIONAR_TAREA', 'VENCIMIENTOS', id, previo, data);
    return data;
  }
};