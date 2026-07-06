import { supabase } from '../../lib/supabase';
import type { Impuesto, ImpuestoFormData, ImpuestoConEspecialista } from './types';
import { usuariosService } from '../usuarios/usuariosService';

export const impuestosService = {
  async getAll() {
    const { data, error } = await supabase
      .from('impuestos')
      .select(`
        *,
        usuarios ( nombre_completo )
      `)
      .is('eliminado', null)
      .order('creado', { ascending: false });
    
    if (error) throw error;
    return data as ImpuestoConEspecialista[];
  },

  async create(formData: ImpuestoFormData) {
    
    const payload = {
      ...formData,
      especialista_id: formData.especialista_id || null 
    };

    const { data, error } = await supabase
      .from('impuestos')
      .insert([payload])
      .select()
      .single();

    if (error) throw new Error('Error al crear el impuesto: ' + error.message);

    await usuariosService.registrarAuditoria('CREAR', 'IMPUESTOS', data.id, null, data);
    return data as Impuesto;
  },

  async update(id: string, formData: ImpuestoFormData) {
    const payload = {
      ...formData,
      especialista_id: formData.especialista_id || null,
      actualizado: new Date().toISOString()
    };

    const { data: previo } = await supabase.from('impuestos').select('*').eq('id', id).single();

    const { data, error } = await supabase
      .from('impuestos')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error('Error al actualizar el impuesto: ' + error.message);

    await usuariosService.registrarAuditoria('MODIFICAR', 'IMPUESTOS', id, previo, data);
    return data as Impuesto;
  },

  async delete(id: string) {
    const { data: previo } = await supabase.from('impuestos').select('*').eq('id', id).single();
    
    const { error } = await supabase
      .from('impuestos')
      .update({ eliminado: new Date().toISOString(), estado: 'INACTIVO' })
      .eq('id', id);

    if (error) throw error;

    await usuariosService.registrarAuditoria('ELIMINAR', 'IMPUESTOS', id, previo, { eliminado: true });
  }
};