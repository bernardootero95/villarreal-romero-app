import { supabase } from '../../lib/supabase';
import type { ClienteFormData } from './types';

export const clientesService = {
  
  async getAll() {
    const { data, error } = await supabase
      .from('clientes')
      .select(`
        *,
        usuarios (
          nombre_completo,
          cargo
        )
      `)
      .is('eliminado', null)
      .order('razon_social', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async create(cliente: ClienteFormData) {
    // 1. Verificamos si el NIT ya existe en la base de datos (incluyendo eliminados)
    const { data: existente } = await supabase
      .from('clientes')
      .select('*')
      .eq('nit', cliente.nit)
      .maybeSingle();

    if (existente) {
      // Si existe y no está eliminado, es un duplicado real
      if (existente.estado === 'ACTIVO' && !existente.eliminado) {
        throw new Error('Ya existe un cliente activo registrado con este NIT.');
      } else {
        // 2. REACTIVACIÓN (Soft-Undelete): El cliente existía y fue borrado. Lo resucitamos.
        const { data: reactivado, error: errUpdate } = await supabase
          .from('clientes')
          .update({
            ...cliente,
            estado: 'ACTIVO',
            eliminado: null, // Limpiamos la marca de borrado
            actualizado: new Date().toISOString()
          })
          .eq('id', existente.id)
          .select()
          .single();

        if (errUpdate) throw new Error('Error al reactivar el cliente histórico: ' + errUpdate.message);

        return reactivado;
      }
    }

    // 3. Si no existe en absoluto, procedemos con la inserción normal
    const { data, error } = await supabase
      .from('clientes')
      .insert([cliente])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new Error('El NIT ingresado ya se encuentra registrado.');
      throw new Error('Error al registrar la empresa: ' + error.message);
    }

    return data;
  },

  async update(id: string, cliente: ClienteFormData) {
    const { data, error } = await supabase
      .from('clientes')
      .update({ 
        ...cliente, 
        actualizado: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new Error('El NIT ingresado ya pertenece a otra empresa.');
      throw new Error('Error al actualizar el cliente: ' + error.message);
    }

    return data;
  },

  async delete(id: string) {
    // Borrado Lógico
    const { error } = await supabase
      .from('clientes')
      .update({
        estado: 'INACTIVO',
        eliminado: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw new Error('Error al desactivar el cliente: ' + error.message);
  },

  async createBulk(clientes: Array<ClienteFormData & { dv: number }>) {
    // Preparamos el payload forzando que todos los registros entren como activos 
    // y sin marca de eliminación, por si reactivan clientes vía Excel.
    const payload = clientes.map(c => ({
      ...c,
      estado: 'ACTIVO',
      eliminado: null,
      actualizado: new Date().toISOString()
    }));

    // El "upsert" con "onConflict: 'nit'" inserta el cliente si es nuevo, 
    // o lo actualiza (reactiva) si el NIT ya existía en la base de datos.
    const { data, error } = await supabase
      .from('clientes')
      .upsert(payload, { onConflict: 'nit' })
      .select();

    if (error) throw new Error('Error en la estructuración de la carga masiva: ' + error.message);

    return data || [];
  }
};