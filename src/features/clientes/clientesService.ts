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

  async update(id: string, formData: ClienteFormData) {
    const { data: previo } = await supabase.from('clientes').select('*').eq('id', id).single();

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
  },

  // Operación SOLID: Inserta clientes en bloque mapeando los datos validados
  async createBulk(clientes: Array<ClienteFormData & { dv: number }>) {
    const { data, error } = await supabase
      .from('clientes')
      .insert(clientes)
      .select();

    if (error) {
      console.error('Error en carga masiva de clientes:', error);
      throw new Error('Error al insertar los clientes en lote. Verifique duplicados de NIT.');
    }

    // Auditoría masiva simplificada por rendimiento
    if (data && data.length > 0) {
      await usuariosService.registrarAuditoria('CREAR', 'CLIENTES', data[0].id, null, { cantidad_cargada: data.length });
    }

    return data as Cliente[];
  }
};