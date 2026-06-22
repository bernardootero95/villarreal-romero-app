import { supabase } from '../../lib/supabase';
import { vencimientosService } from '../calendario/vencimientosService';
import { clientesService } from '../clientes/clientesService';

export const dashboardService = {
  async getMetricasContador(usuarioId: string, cargo: string) {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = hoy.getMonth();

    // Consultas concurrentes optimizadas con Promise.all para máxima velocidad
    const [todosLosClientes, todosLosVencimientos] = await Promise.all([
      clientesService.getAll(),
      vencimientosService.getVencimientosMes(anio, mes, usuarioId, cargo)
    ]);

    // 1. Filtrar clientes bajo la responsabilidad de este usuario
    const clientesAsignados = todosLosClientes.filter(
      (c) => c.contador_id === usuarioId && c.estado === 'ACTIVO'
    );

    // 2. Vencimientos del mes (ya filtrados por permisos de rol desde el vencimientosService)
    const totalVencimientosMes = todosLosVencimientos.length;

    // 3. Segmentación operativa de tareas pendientes de ejecución
    const pendientes = todosLosVencimientos.filter(
      (v) => v.estado_tarea === 'PENDIENTE' || v.estado_tarea === 'REVISIÓN'
    ).length;

    // 4. Cálculo matemático estricto del porcentaje de efectividad
    const presentados = todosLosVencimientos.filter((v) => v.estado_tarea === 'PRESENTADO').length;
    const efectividad = totalVencimientosMes > 0 
      ? Math.round((presentados / totalVencimientosMes) * 100) 
      : 100;

    return {
      totalClientes: clientesAsignados.length,
      totalVencimientos: totalVencimientosMes,
      tareasPendientes: pendientes,
      porcentajeEfectividad: efectividad,
    };
  }
};