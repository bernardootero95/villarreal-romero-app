import { supabase } from '../../lib/supabase';
import type { Cliente, ClienteFormData, ClienteConContador } from './types';
import { usuariosService } from '../usuarios/usuariosService';

export const clientesService = {
  async getAll() {
    const { data, error } = await supabase
      .from('clientes')
      .select(`
        *,
        usuarios ( nombre_completo )
      `)
      .is('eliminado', null)
      .order('creado', { ascending: false });
    
    if (error) throw error;
    return data as ClienteConContador[];
  },

  async create(formData: ClienteFormData) {
    const { data, error } = await supabase
      .from('clientes')
      .insert([formData])
      .select()
      .single();

    if (error) {
      console.error('Error en Supabase:', error);
      throw new Error('No se pudo registrar el cliente. Verifica que el NIT no esté duplicado.');
    }

    await usuariosService.registrarAuditoria('CREAR', 'CLIENTES', data.id, null, data);
    return data as Cliente;
  },

  // NUEVA FUNCIÓN DE ACTUALIZACIÓN
  async update(id: string, formData: ClienteFormData) {
    // 1. Obtenemos el dato previo para la auditoría
    const { data: previo } = await supabase.from('clientes').select('*').eq('id', id).single();

    // 2. Actualizamos el registro (incluyendo la fecha de actualización)
    const { data, error } = await supabase
      .from('clientes')
      .update({ ...formData, actualizado: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error en Supabase:', error);
      throw new Error('No se pudo actualizar el cliente.');
    }

    // 3. Registramos la auditoría
    await usuariosService.registrarAuditoria('MODIFICAR', 'CLIENTES', id, previo, data);
    return data as Cliente;
  },

  async delete(id: string) {
    const { data: previo } = await supabase.from('clientes').select('*').eq('id', id).single();
    
    const { error } = await supabase
      .from('clientes')
      .update({ eliminado: new Date().toISOString(), estado: 'INACTIVO' })
      .eq('id', id);

    if (error) throw error;

    await usuariosService.registrarAuditoria('ELIMINAR', 'CLIENTES', id, previo, { eliminado: true });
  }
};