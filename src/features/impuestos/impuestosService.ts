import { supabase } from '../../lib/supabase';
import type { Impuesto, ImpuestoFormData, ImpuestoConEspecialista } from './types';

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

    return data as Impuesto;
  },

  async update(id: string, formData: ImpuestoFormData) {
    const payload = {
      ...formData,
      especialista_id: formData.especialista_id || null,
      actualizado: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('impuestos')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error('Error al actualizar el impuesto: ' + error.message);

    return data as Impuesto;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('impuestos')
      .update({ eliminado: new Date().toISOString(), estado: 'INACTIVO' })
      .eq('id', id);

    if (error) throw error;
  }
};