import { supabase } from "../../lib/supabase";
import { Usuario, UsuarioFormData } from "./types";

export const usuariosService = {
  // Obtener todos los usuarios no eliminados
  async getAll() {
    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .is("eliminado", null)
      .order("creado", { ascending: false });

    if (error) throw error;
    return data as Usuario[];
  },

  // Registrar auditoría de forma genérica
  async registrarAuditoria(
    accion: string,
    modulo: string,
    id: string,
    previo: any = null,
    nuevo: any = null,
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("auditoria").insert({
      usuario_id: user.id,
      accion,
      modulo,
      registro_id: id,
      datos_previos: previo,
      datos_nuevos: nuevo,
    });
  },

  // Crear Usuario (Nota: En Supabase Auth se suele hacer vía Edge Function,
  // aquí asumimos que ya existe en Auth o manejamos solo la tabla pública por ahora)
  async create(id: string, formData: UsuarioFormData) {
    const { data, error } = await supabase
      .from("usuarios")
      .insert([{ id, ...formData }])
      .select()
      .single();

    if (error) throw error;

    await this.registrarAuditoria("CREAR", "USUARIOS", id, null, data);
    return data;
  },

  // Soft Delete (Marcar como eliminado)
  async delete(id: string) {
    const { data: previo } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", id)
      .single();

    const { error } = await supabase
      .from("usuarios")
      .update({ eliminado: new Date().toISOString(), estado: "INACTIVO" })
      .eq("id", id);

    if (error) throw error;

    await this.registrarAuditoria("ELIMINAR", "USUARIOS", id, previo, {
      eliminado: true,
    });
  },
};
