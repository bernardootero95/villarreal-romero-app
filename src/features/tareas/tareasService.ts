import { supabase } from '../../lib/supabase';
import type { Tarea, TareaFormData } from './types';
import { usuariosService } from '../usuarios/usuariosService';

export const tareasService = {
  async getAll(usuarioId: string, cargo: string) {
    let query = supabase
      .from('tareas')
      .select(`
        *,
        usuarios ( nombre_completo )
      `)
      .is('eliminado', null)
      .order('fecha_limite', { ascending: true });

    // LÓGICA SOLID: Si no es administrador, solo puede ver sus propias tareas
    if (!['Gerente', 'Ingeniero'].includes(cargo)) {
      query = query.eq('usuario_id', usuarioId);
    }

    const { data, error } = await query;
    if (error) throw new Error('Error al sincronizar tareas: ' + error.message);
    return data as Tarea[];
  },

  async create(formData: TareaFormData) {
    const { data, error } = await supabase
      .from('tareas')
      .insert([formData])
      .select()
      .single();

    if (error) throw new Error('Error al crear la tarea: ' + error.message);
    await usuariosService.registrarAuditoria('CREAR', 'TAREAS', data.id, null, data);
    return data as Tarea;
  },

  async update(id: string, formData: TareaFormData) {
    const { data: previo } = await supabase.from('tareas').select('*').eq('id', id).single();
    
    const { data, error } = await supabase
      .from('tareas')
      .update({ ...formData, actualizado: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error('Error al actualizar la tarea: ' + error.message);
    await usuariosService.registrarAuditoria('MODIFICAR', 'TAREAS', id, previo, data);
    return data as Tarea;
  },

  async delete(id: string) {
    const { data: previo } = await supabase.from('tareas').select('*').eq('id', id).single();
    const { error } = await supabase
      .from('tareas')
      .update({ eliminado: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error('Error al eliminar la tarea: ' + error.message);
    await usuariosService.registrarAuditoria('ELIMINAR', 'TAREAS', id, previo, { eliminado: true });
  },

  async updateEstado(id: string, estado: string) {
    const { data, error } = await supabase
      .from('tareas')
      .update({ estado, actualizado: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error('Error al actualizar estado: ' + error.message);
    return data as Tarea;
  }
};