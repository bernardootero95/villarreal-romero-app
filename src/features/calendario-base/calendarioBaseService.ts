import { supabase } from '../../lib/supabase';
import type { CalendarioBase, CalendarioBaseFormData, CalendarioBaseConImpuesto } from './types';
import { usuariosService } from '../usuarios/usuariosService';

export const calendarioBaseService = {
  // Obtener las fechas configuradas, idealmente filtradas por año
  async getAll(anio: number) {
    const { data, error } = await supabase
      .from('calendario_base_impuestos')
      .select(`
        *,
        impuestos ( nombre, periodicidad, regla_vencimiento )
      `)
      .eq('anio', anio)
      .order('impuesto_id', { ascending: true })
      .order('periodo', { ascending: true })
      .order('digito', { ascending: true });
    
    if (error) throw error;
    return data as CalendarioBaseConImpuesto[];
  },

  async create(formData: CalendarioBaseFormData) {
    // Si no enviaron dígito (porque es fecha fija), nos aseguramos de que viaje como null
    const payload = {
      ...formData,
      digito: formData.digito === '' || formData.digito === undefined || isNaN(formData.digito as number) 
        ? null 
        : Number(formData.digito)
    };

    const { data, error } = await supabase
      .from('calendario_base_impuestos')
      .insert([payload])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Código de error PostgreSQL para UNIQUE violation
        throw new Error('Ya existe una fecha configurada para este impuesto, año, periodo y dígito.');
      }
      throw new Error('Error al guardar la fecha oficial: ' + error.message);
    }

    await usuariosService.registrarAuditoria('CREAR', 'CALENDARIO_BASE', data.id, null, data);
    return data as CalendarioBase;
  },

  async update(id: string, formData: CalendarioBaseFormData) {
    const payload = {
      ...formData,
      digito: formData.digito === '' || formData.digito === undefined || isNaN(formData.digito as number) 
        ? null 
        : Number(formData.digito),
      actualizado: new Date().toISOString()
    };

    const { data: previo } = await supabase.from('calendario_base_impuestos').select('*').eq('id', id).single();

    const { data, error } = await supabase
      .from('calendario_base_impuestos')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Ya existe una fecha configurada para este impuesto, año, periodo y dígito.');
      }
      throw new Error('Error al actualizar la fecha oficial: ' + error.message);
    }

    await usuariosService.registrarAuditoria('MODIFICAR', 'CALENDARIO_BASE', id, previo, data);
    return data as CalendarioBase;
  },

  async delete(id: string) {
    const { data: previo } = await supabase.from('calendario_base_impuestos').select('*').eq('id', id).single();
    
    // Aquí hacemos HARD DELETE (borrado real) porque una fecha oficial mal creada es un error de digitación, no un historial.
    const { error } = await supabase
      .from('calendario_base_impuestos')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === '23503') { // Violación de Foreign Key (ON DELETE RESTRICT)
        throw new Error('No puedes borrar esta fecha porque ya hay vencimientos de clientes calculados con ella. Debes modificarla.');
      }
      throw new Error('Error al eliminar: ' + error.message);
    }

    await usuariosService.registrarAuditoria('ELIMINAR', 'CALENDARIO_BASE', id, previo, null);
  },

  async createBulk(registros: CalendarioBaseFormData[]) {
    const payloads = registros.map(r => ({
      impuesto_id: r.impuesto_id,
      anio: r.anio,
      periodo: r.periodo,
      digito: r.digito === '' || r.digito === undefined || isNaN(r.digito as number) 
        ? null 
        : Number(r.digito),
      fecha_vencimiento_oficial: r.fecha_vencimiento_oficial
    }));

    const { data, error } = await supabase
      .from('calendario_base_impuestos')
      .insert(payloads)
      .select();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Error: Al menos una de las fechas en tu lista ya existe en la base de datos (Duplicado).');
      }
      throw new Error('Error en la carga masiva: ' + error.message);
    }

    // Auditoría de carga masiva
    await usuariosService.registrarAuditoria('CREAR_MASIVO', 'CALENDARIO_BASE', 'bulk', null, { cantidad: payloads.length });
    return data;
  },
};