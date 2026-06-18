import { supabase } from '../../lib/supabase';
import type { Usuario, UsuarioFormData } from './types';

export const usuariosService = {
  // Obtener todos los usuarios no eliminados
  async getAll() {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .is('eliminado', null)
      .order('creado', { ascending: false });
    
    if (error) throw error;
    return data as Usuario[];
  },

  // Registrar auditoría de forma genérica
  async registrarAuditoria(accion: string, modulo: string, id: string, previo: any = null, nuevo: any = null) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('auditoria').insert({
      usuario_id: user.id,
      accion,
      modulo,
      text_id: id, // O el campo homólogo de tu tabla de auditoría para el ID del registro afectado
      registro_id: id,
      datos_previos: previo,
      datos_nuevos: nuevo
    });
  },

  // Crear Usuario mediante la Edge Function
  async create(formData: UsuarioFormData) {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase.functions.invoke('crear-usuario', {
      body: {
        ...formData,
        admin_id: user?.id
      }
    });

    if (error) {
      console.error('Error invocando function:', error);
      throw new Error('No se pudo crear el usuario');
    }

    if (data.error) {
      throw new Error(data.error);
    }

    return data;
  },

  // NUEVA FUNCIÓN DE ACTUALIZACIÓN
  async update(id: string, formData: UsuarioFormData) {
    // 1. Capturamos el estado actual antes de cambiarlo
    const { data: previo } = await supabase.from('usuarios').select('*').eq('id', id).single();

    // 2. Ejecutamos la actualización
    const { data, error } = await supabase
      .from('usuarios')
      .update({
        nombre_completo: formData.nombre_completo,
        email: formData.email,
        cargo: formData.cargo,
        estado: formData.estado,
        actualizado: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // 3. Dejamos rastro en la auditoría
    await this.registrarAuditoria('MODIFICAR', 'USUARIOS', id, previo, data);
    return data;
  },

  // Soft Delete (Marcar como inactivo y guardar timestamp)
  async delete(id: string) {
    const { data: previo } = await supabase.from('usuarios').select('*').eq('id', id).single();
    
    const { error } = await supabase
      .from('usuarios')
      .update({ eliminado: new Date().toISOString(), estado: 'INACTIVO' })
      .eq('id', id);

    if (error) throw error;

    await this.registrarAuditoria('ELIMINAR', 'USUARIOS', id, previo, { eliminado: true });
  }
};