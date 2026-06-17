import { supabase } from '../../lib/supabase';
import type { Usuario, UsuarioFormData } from './types';

export const usuariosService = {
  async getAll() {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .is('eliminado', null)
      .order('creado', { ascending: false });
    
    if (error) throw error;
    return data as Usuario[];
  },

  async registrarAuditoria(accion: string, modulo: string, id: string, previo: any = null, nuevo: any = null) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('auditoria').insert({
      usuario_id: user.id,
      accion,
      modulo,
      registro_id: id,
      datos_previos: previo,
      datos_nuevos: nuevo
    });
  },

  // LLAMADA A LA EDGE FUNCTION ACTUALIZADA
  async create(formData: UsuarioFormData) {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Invocamos la función segura en la nube
    const { data, error } = await supabase.functions.invoke('crear-usuario', {
      body: {
        ...formData,
        admin_id: user?.id // Pasamos el ID del admin para la auditoría
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