import { supabase } from '../../lib/supabase';
import type { ClienteFormData } from './types';

export interface ClientesQueryParams {
  page: number;
  pageSize: number;
  search?: string;
  contadorId?: string;
}

export const clientesService = {

  // Paginado y filtrado en el servidor (para el directorio general en ClientesPage):
  // trae solo la página pedida, no la tabla completa.
  async getAll({ page, pageSize, search = '', contadorId = '' }: ClientesQueryParams) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('clientes')
      .select(`
        *,
        usuarios (
          nombre_completo,
          cargo
        )
      `, { count: 'exact' })
      .is('eliminado', null)
      .order('razon_social', { ascending: true })
      .range(from, to);

    // Los caracteres ,()  tienen significado especial en la sintaxis de filtros de
    // PostgREST (.or()); se descartan del término de búsqueda para no romper el filtro.
    const term = search.trim().replace(/[,()]/g, '');
    if (term) {
      query = query.or(`razon_social.ilike.%${term}%,nit.ilike.%${term}%`);
    }

    if (contadorId) {
      query = query.eq('contador_id', contadorId);
    }

    const { data, error, count } = await query;

    if (error) throw error;
    return { data: data || [], count: count || 0 };
  },

  // Un solo cliente por id (para DetalleClientePage) — no depende de tener la lista
  // paginada completa en caché.
  async getById(id: string) {
    const { data, error } = await supabase
      .from('clientes')
      .select(`
        *,
        usuarios (
          nombre_completo,
          cargo
        )
      `)
      .eq('id', id)
      .is('eliminado', null)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Todos los clientes activos de un contador puntual (para "Mis Empresas Asignadas" en
  // PerfilPage) — ya viene acotado por contador_id en el servidor, así que no hace falta
  // paginar: por diseño es un subconjunto pequeño de la tabla completa.
  async getMisClientes(contadorId: string) {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('contador_id', contadorId)
      .eq('estado', 'ACTIVO')
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