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
      text_id: id,
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

  // Actualización básica de metadatos
  async update(id: string, formData: UsuarioFormData) {
    const { data: previo } = await supabase.from('usuarios').select('*').eq('id', id).single();

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

    await this.registrarAuditoria('MODIFICAR', 'USUARIOS', id, previo, data);
    return data;
  },

  // Soft Delete
  async delete(id: string) {
    const { data: previo } = await supabase.from('usuarios').select('*').eq('id', id).single();
    
    const { error } = await supabase
      .from('usuarios')
      .update({ eliminado: new Date().toISOString(), estado: 'INACTIVO' })
      .eq('id', id);

    if (error) throw error;

    await this.registrarAuditoria('ELIMINAR', 'USUARIOS', id, previo, { eliminado: true });
  },

  /**
   * REFACTOR SOLID (SRP & SEGURIDAD): Migrado de cliente directo a invocación de Edge Function segura.
   * Evita la filtración de credenciales maestras y soluciona el error 401 de manera definitiva.
   */
  async forzarCambioPassword(usuarioId: string, nuevaClave: string): Promise<void> {
    if (!usuarioId || nuevaClave.length < 6) {
      throw new Error("La nueva clave de acceso debe tener por lo menos 6 caracteres.");
    }

    const { data: { user } } = await supabase.auth.getUser();

    // Invocamos la Edge Function pasando las credenciales y el autorizador en el body seguro
    const { data, error } = await supabase.functions.invoke('resetear-clave', {
      body: {
        usuario_id: usuarioId,
        nueva_clave: nuevaClave.trim(),
        admin_id: user?.id
      }
    });

    if (error) {
      console.error('Error de red al invocar Edge Function:', error);
      throw new Error('No se pudo establecer comunicación con el módulo de rescate.');
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    await this.registrarAuditoria('RESET_PASSWORD_FORZADO', 'USUARIOS', usuarioId, { info: 'Contraseña alterada mediante túnel Edge Function por administración' }, null);
  }
};