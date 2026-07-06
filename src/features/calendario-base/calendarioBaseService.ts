import { supabase } from '../../lib/supabase';
import type { CalendarioBase, CalendarioBaseFormData, CalendarioBaseConImpuesto } from './types';
import { usuariosService } from '../usuarios/usuariosService';

export const calendarioBaseService = {
  
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
    const payload = {
      ...formData,
      digito: formData.digito ?? null
    };

    const { data, error } = await supabase
      .from('calendario_base_impuestos')
      .insert([payload])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Ya existe una fecha configurada para este impuesto, año, periodo y dígito.');
      }
      throw new Error('Error al guardar la fecha oficial: ' + error.message);
    }

    await usuariosService.registrarAuditoria('CREAR', 'CALENDARIO_BASE', data.id, null, data);
    
    await this.sincronizarVencimientosConCalendarioBase(data as CalendarioBase);
    
    return data as CalendarioBase;
  },

  async update(id: string, formData: CalendarioBaseFormData) {
    const payload = {
      ...formData,
      digito: formData.digito ?? null,
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
    
    await this.sincronizarVencimientosConCalendarioBase(data as CalendarioBase);
    
    return data as CalendarioBase;
  },

  async delete(id: string) {
    const { data: previo } = await supabase.from('calendario_base_impuestos').select('*').eq('id', id).single();
    
    const { error } = await supabase
      .from('calendario_base_impuestos')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === '23503') {
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
      digito: r.digito ?? null,
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

    await usuariosService.registrarAuditoria('CREAR_MASIVO', 'CALENDARIO_BASE', 'bulk', null, { cantidad: payloads.length });

    
    if (data && data.length > 0) {
      for (const registro of data) {
        await this.sincronizarVencimientosConCalendarioBase(registro as CalendarioBase);
      }
    }

    return data;
  },

  
  async sincronizarVencimientosConCalendarioBase(calendario: CalendarioBase) {
    try {
      
      const { data: asignaciones, error: errAsig } = await supabase
        .from('cliente_impuestos')
        .select(`
          cliente_id,
          clientes!inner ( nit )
        `)
        .eq('impuesto_id', calendario.impuesto_id)
        .eq('estado', 'ACTIVO')
        .is('eliminado', null);

      if (errAsig || !asignaciones || asignaciones.length === 0) return;

      
      const clientesAfectados = asignaciones.filter((asig: any) => {
        if (calendario.digito === null) return true; 
        const ultimoDigitoCliente = Number(String(asig.clientes.nit).slice(-1));
        return ultimoDigitoCliente === calendario.digito;
      });

      if (clientesAfectados.length === 0) return;

      const periodoFiscalStr = `${calendario.anio}-${calendario.periodo}`;

      for (const asig of clientesAfectados) {
        
        const { data: vtoExistente } = await supabase
          .from('vencimientos')
          .select('id, estado_tarea')
          .eq('cliente_id', asig.cliente_id)
          .eq('calendario_base_id', calendario.id)
          .maybeSingle();

        if (vtoExistente) {
          
          if (vtoExistente.estado_tarea !== 'PRESENTADO') {
            await supabase
              .from('vencimientos')
              .update({ 
                fecha_limite: calendario.fecha_vencimiento_oficial,
                actualizado: new Date().toISOString()
              })
              .eq('id', vtoExistente.id);
          }
        } else {
          
          await supabase
            .from('vencimientos')
            .insert([{
              cliente_id: asig.cliente_id,
              impuesto_id: calendario.impuesto_id,
              calendario_base_id: calendario.id,
              fecha_limite: calendario.fecha_vencimiento_oficial,
              periodo_fiscal: periodoFiscalStr,
              estado_tarea: 'PENDIENTE'
            }]);
        }
      }
    } catch (err) {
      console.error('Error crítico en sincronización reactiva de agendas:', err);
    }
  }
};