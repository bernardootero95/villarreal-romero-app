import { supabase } from '../../lib/supabase';
import type { Cliente, ClienteFormData, ClienteConContador } from './types';
import { usuariosService } from '../usuarios/usuariosService';

// Aquí está la exportación exacta que React está buscando
export const clientesService = {
  // Obtener todos los clientes (Incluye el nombre del contador mediante una relación)
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

  // Crear un nuevo cliente
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

    // Reutilizamos el sistema de auditoría central
    await usuariosService.registrarAuditoria('CREAR', 'CLIENTES', data.id, null, data);
    return data as Cliente;
  },

  // Soft Delete de Cliente
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