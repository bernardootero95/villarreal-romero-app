import { supabase } from '../../lib/supabase';

export const clienteImpuestosService = {
  
  async getImpuestosPorCliente(clienteId: string) {
    const { data, error } = await supabase
      .from('cliente_impuestos')
      .select(`
        id,
        estado,
        impuestos (
          id,
          nombre,
          periodicidad,
          regla_vencimiento
        )
      `)
      .eq('cliente_id', clienteId)
      .is('eliminado', null);

    if (error) throw error;
    return data;
  },

  async asignarImpuesto(clienteId: string, impuestoId: string) {
    
    const { data: existenciaPrevia } = await supabase
      .from('cliente_impuestos')
      .select('*')
      .eq('cliente_id', clienteId)
      .eq('impuesto_id', impuestoId)
      .single();

    let asignacion;

    if (existenciaPrevia) {
      const { data: reactivado, error: errorReactivar } = await supabase
        .from('cliente_impuestos')
        .update({ estado: 'ACTIVO', eliminado: null })
        .eq('id', existenciaPrevia.id)
        .select()
        .single();

      if (errorReactivar) throw errorReactivar;
      asignacion = reactivado;
    } else {
      const { data: nuevaAsignacion, error: errorAsignacion } = await supabase
        .from('cliente_impuestos')
        .insert([{ cliente_id: clienteId, impuesto_id: impuestoId, estado: 'ACTIVO' }])
        .select()
        .single();

      if (errorAsignacion) {
        if (errorAsignacion.code === '23505') throw new Error('El cliente ya tiene asignada esta obligación.');
        throw errorAsignacion;
      }
      asignacion = nuevaAsignacion;
    }

    // 1. Extraemos el NIT de la base de datos
    const { data: clienteInfo } = await supabase
      .from('clientes')
      .select('nit')
      .eq('id', clienteId)
      .single();
      
    const nitCliente = clienteInfo?.nit ? String(clienteInfo.nit) : "";
    const anioActual = new Date().getFullYear();
    
    // 2. Traemos todas las reglas del calendario para el impuesto este año
    const { data: fechasOficialesTodas, error: errorCalendario } = await supabase
      .from('calendario_base_impuestos')
      .select('*')
      .eq('impuesto_id', impuestoId)
      .eq('anio', anioActual);

    if (errorCalendario) throw errorCalendario;

    // 3. Cruzamos dinámicamente usando 1 o 2 caracteres como texto exacto
    const fechasOficiales = fechasOficialesTodas?.filter(cal => {
      if (cal.digito === null || cal.digito === '') return true;
      const longitudDigito = String(cal.digito).length;
      const extractoNit = nitCliente.slice(-longitudDigito);
      return extractoNit === String(cal.digito);
    }) || [];

    if (fechasOficiales.length > 0) {
      // Consultamos qué vencimientos ya existen para este cliente e impuesto
      const { data: existentes } = await supabase
        .from('vencimientos')
        .select('calendario_base_id')
        .eq('cliente_id', clienteId)
        .eq('impuesto_id', impuestoId);

      const idsExistentes = existentes?.map(v => v.calendario_base_id) || [];

      const vencimientosPayload = fechasOficiales
        .filter(fechaBase => !idsExistentes.includes(fechaBase.id))
        .map(fechaBase => ({
          cliente_id: clienteId,
          impuesto_id: impuestoId,
          calendario_base_id: fechaBase.id,
          fecha_limite: fechaBase.fecha_vencimiento_oficial,
          periodo_fiscal: `${fechaBase.anio}-${fechaBase.periodo}`,
          estado_tarea: 'PENDIENTE'
        }));

      if (vencimientosPayload.length > 0) {
        const { error: errorVencimientos } = await supabase
          .from('vencimientos')
          .insert(vencimientosPayload);

        if (errorVencimientos) console.error('Error generando agenda automática:', errorVencimientos);
      }
    }

    return asignacion;
  },

  async desasignarImpuesto(asignacionId: string, clienteId: string, impuestoId: string) {
    const ahora = new Date().toISOString();

    const { error: errorSunc } = await supabase
      .from('cliente_impuestos')
      .update({ estado: 'INACTIVO', eliminado: ahora })
      .eq('id', asignacionId);

    if (errorSunc) throw errorSunc;

    const { error: errorClean } = await supabase
      .from('vencimientos')
      .delete()
      .eq('cliente_id', clienteId)
      .eq('impuesto_id', impuestoId)
      .eq('estado_tarea', 'PENDIENTE');

    if (errorClean) console.error('Error limpiando agenda pendiente:', errorClean);
  },

  async asignarImpuestosBulk(obligaciones: Array<{ cliente_id: string; impuesto_id: string; estado: string }>) {
    if (obligaciones.length === 0) return;

    const { error } = await supabase
      .from('cliente_impuestos')
      .insert(obligaciones)
      .select();

    if (error) {
      console.error('Error inyectando obligaciones masivas:', error);
      throw new Error('No se pudieron vincular las obligaciones en lote.');
    }

    // 1. Obtener todos los NITs de los clientes involucrados en el cargue
    const clientIds = [...new Set(obligaciones.map(o => o.cliente_id))];
    const { data: clientesData } = await supabase
      .from('clientes')
      .select('id, nit')
      .in('id', clientIds);
      
    const nitMap: Record<string, string> = {};
    clientesData?.forEach(c => {
      nitMap[c.id] = String(c.nit);
    });

    const anioActual = new Date().getFullYear();
    const { data: calendarios } = await supabase
      .from('calendario_base_impuestos')
      .select('*')
      .eq('anio', anioActual);

    if (!calendarios || calendarios.length === 0) return;

    const vencimientosPayload: any[] = [];

    for (const ob of obligaciones) {
      const nitCliente = nitMap[ob.cliente_id] || "";

      // 2. Cruce dinámico con la longitud exacta requerida por el calendario
      const fechasFiltradas = calendarios.filter(c => {
        if (c.impuesto_id !== ob.impuesto_id) return false;
        if (c.digito === null || c.digito === '') return true;
        const longitudDigito = String(c.digito).length;
        const extractoNit = nitCliente.slice(-longitudDigito);
        return extractoNit === String(c.digito);
      });

      fechasFiltradas.forEach(f => {
        vencimientosPayload.push({
          cliente_id: ob.cliente_id,
          impuesto_id: ob.impuesto_id,
          calendario_base_id: f.id,
          fecha_limite: f.fecha_vencimiento_oficial,
          periodo_fiscal: `${f.anio}-${f.periodo}`,
          estado_tarea: 'PENDIENTE'
        });
      });
    }

    if (vencimientosPayload.length > 0) {
      const { error: errorVtos } = await supabase.from('vencimientos').insert(vencimientosPayload);
      if (errorVtos) console.error('Error inyectando cronogramas masivos:', errorVtos);
    }
  }
};