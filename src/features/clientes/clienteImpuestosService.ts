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

  // 2. ASIGNAR IMPUESTO Y GENERAR EL CALENDARIO AUTOMÁTICO
  async asignarImpuesto(clienteId: string, impuestoId: string, ultimoDigitoNit: number) {
    // A. Insertar la obligación (matriz de responsabilidad)
    const { data: asignacion, error: errorAsignacion } = await supabase
      .from('cliente_impuestos')
      .insert([{ cliente_id: clienteId, impuesto_id: impuestoId, estado: 'ACTIVO' }])
      .select()
      .single();

    if (errorAsignacion) {
      if (errorAsignacion.code === '23505') throw new Error('El cliente ya tiene asignada esta obligación.');
      throw errorAsignacion;
    }

    // B. AUTOMATIZACIÓN: Buscar las fechas oficiales en el Calendario Base
    // Filtramos por el año actual para programar la agenda vigente
    const anioActual = new Date().getFullYear();
    
    let queryBase = supabase
      .from('calendario_base_impuestos')
      .select('*')
      .eq('impuesto_id', impuestoId)
      .eq('anio', anioActual);

    // Si el impuesto depende del NIT, filtramos por el dígito correspondiente
    // Si es FECHA_FIJA, en el calendario base el dígito es NULL
    const { data: impuestoInfo } = await supabase.from('impuestos').select('regla_vencimiento').eq('id', impuestoId).single();
    
    if (impuestoInfo?.regla_vencimiento === 'FECHA_FIJA') {
      queryBase = queryBase.is('digito', null);
    } else {
      queryBase = queryBase.eq('digito', ultimoDigitoNit);
    }

    const { data: fechasOficiales, error: errorCalendario } = await queryBase;

    if (errorCalendario) throw errorCalendario;

    // C. Si hay fechas oficializadas por el gobierno, le sembramos la agenda al cliente
    if (fechasOficiales && fechasOficiales.length > 0) {
      const vencimientosPayload = fechasOficiales.map(fechaBase => ({
        cliente_id: clienteId,
        impuesto_id: impuestoId,
        calendario_base_id: fechaBase.id,
        fecha_limite: fechaBase.fecha_vencimiento_oficial,
        periodo_fiscal: `${fechaBase.anio}-${fechaBase.periodo}`,
        estado_tarea: 'PENDIENTE'
      }));

      const { error: errorVencimientos } = await supabase
        .from('vencimientos')
        .insert(vencimientosPayload);

      if (errorVencimientos) console.error('Error generando agenda automática:', errorVencimientos);
    }

    return asignacion;
  },

  // 3. DESASIGNAR / QUITAR RESPONSABILIDAD (Con limpieza de agenda pendiente)
  async desasignarImpuesto(asignacionId: string, clienteId: string, impuestoId: string) {
    const ahora = new Date().toISOString();

    // A. Soft Delete en la matriz de responsabilidades para guardar el histórico
    const { error: errorSunc } = await supabase
      .from('cliente_impuestos')
      .update({ estado: 'INACTIVO', eliminado: ahora })
      .eq('id', asignacionId);

    if (errorSunc) throw errorSunc;

    // B. Limpieza preventiva: Removemos del calendario visual las tareas de este impuesto 
    // que todavía estén 'PENDIENTES'. Las tareas ya 'PRESENTADAS' se conservan por histórico financiero.
    const { error: errorClean } = await supabase
      .from('vencimientos')
      .delete()
      .eq('cliente_id', clienteId)
      .eq('impuesto_id', impuestoId)
      .eq('estado_tarea', 'PENDIENTE');

    if (errorClean) console.error('Error limpiando agenda pendiente:', errorClean);
  }
};