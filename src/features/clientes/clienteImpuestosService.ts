import { supabase } from '../../lib/supabase';

export const clienteImpuestosService = {
  // 1. Obtener los impuestos activos de un cliente específico
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

  // 2. ASIGNAR IMPUESTO Y GENERAR EL CALENDARIO AUTOMÁTICO (CORREGIDO PARA ADMITIR RE-ACTIVACIONES)
  async asignarImpuesto(clienteId: string, impuestoId: string, ultimoDigitoNit: number) {
    // A. SOLID: Verificar si el registro ya existía previamente inactivo (Soft Deleted)
    const { data: existenciaPrevia } = await supabase
      .from('cliente_impuestos')
      .select('*')
      .eq('cliente_id', clienteId)
      .eq('impuesto_id', impuestoId)
      .single();

    let asignacion;

    if (existenciaPrevia) {
      // Si ya existía, lo reactivamos limpiando la marca de borrado
      const { data: reactivado, error: errorReactivar } = await supabase
        .from('cliente_impuestos')
        .update({ estado: 'ACTIVO', eliminado: null })
        .eq('id', existenciaPrevia.id)
        .select()
        .single();

      if (errorReactivar) throw errorReactivar;
      asignacion = reactivado;
    } else {
      // Si es completamente nuevo, procedemos con el flujo de inserción estándar
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

    // B. AUTOMATIZACIÓN: Buscar las fechas oficiales en el Calendario Base
    const anioActual = new Date().getFullYear();
    
    let queryBase = supabase
      .from('calendario_base_impuestos')
      .select('*')
      .eq('impuesto_id', impuestoId)
      .eq('anio', anioActual);

    const { data: impuestoInfo } = await supabase.from('impuestos').select('regla_vencimiento').eq('id', impuestoId).single();
    
    if (impuestoInfo?.regla_vencimiento === 'FECHA_FIJA') {
      queryBase = queryBase.is('digito', null);
    } else {
      queryBase = queryBase.eq('digito', ultimoDigitoNit);
    }

    const { data: fechasOficiales, error: errorCalendario } = await queryBase;

    if (errorCalendario) throw errorCalendario;

    // C. Si hay fechas oficializadas por el gobierno, le sembramos la agenda al cliente (Evitando duplicar tareas existentes)
    if (fechasOficiales && fechasOficiales.length > 0) {
      // Consultamos qué vencimientos ya existen para este cliente e impuesto
      const { data: existentes } = await supabase
        .from('vencimientos')
        .select('calendario_base_id')
        .eq('cliente_id', clienteId)
        .eq('impuesto_id', impuestoId);

      const idsExistentes = existentes?.map(v => v.calendario_base_id) || [];

      // Filtramos para inyectar únicamente los que hagan falta
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

  // 3. DESASIGNAR / QUITAR RESPONSABILIDAD (Con limpieza de agenda pendiente)
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

  // 4. Operación SOLID Masiva: Procesa en lote un set estructurado de obligaciones tributarias
  async asignarImpuestosBulk(obligaciones: Array<{ cliente_id: string; impuesto_id: string; estado: string }>, ultimoDigitoMapa: Record<string, number>) {
    if (obligaciones.length === 0) return;

    const { error } = await supabase
      .from('cliente_impuestos')
      .insert(obligaciones)
      .select();

    if (error) {
      console.error('Error inyectando obligaciones masivas:', error);
      throw new Error('No se pudieron vincular las obligaciones en lote.');
    }

    const anioActual = new Date().getFullYear();
    const { data: calendarios } = await supabase
      .from('calendario_base_impuestos')
      .select('*')
      .eq('anio', anioActual);

    if (!calendarios || calendarios.length === 0) return;

    const vencimientosPayload: any[] = [];

    for (const ob of obligaciones) {
      const digitoCliente = ultimoDigitoMapa[ob.cliente_id];

      const fechasFiltradas = calendarios.filter(c => {
        if (c.impuesto_id !== ob.impuesto_id) return false;
        return c.digito === null || c.digito === digitoCliente;
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