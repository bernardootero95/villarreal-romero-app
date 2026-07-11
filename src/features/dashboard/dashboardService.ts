import { supabase } from '../../lib/supabase';
import { vencimientosService } from '../calendario/vencimientosService';
import { clientesService } from '../clientes/clientesService';

export const dashboardService = {
  async getMetricasContador(usuarioId: string, cargo: string) {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = hoy.getMonth();

    
    const [todosLosClientes, todosLosVencimientos] = await Promise.all([
      clientesService.getAll(),
      vencimientosService.getVencimientosMes(anio, mes, usuarioId, cargo)
    ]);

    const esIngeniero = cargo === 'Ingeniero';
    const clientesAsignados = todosLosClientes.filter((c) => {
      if (esIngeniero) return c.estado === 'ACTIVO';
      return c.contador_id === usuarioId && c.estado === 'ACTIVO';
    });

    const totalVencimientosMes = todosLosVencimientos.length;

    const pendientes = todosLosVencimientos.filter(
      (v) => v.estado_tarea === 'PENDIENTE' || v.estado_tarea === 'REVISIÓN'
    ).length;

    const presentados = todosLosVencimientos.filter((v) => v.estado_tarea === 'PRESENTADO').length;
    
    const efectividad = totalVencimientosMes > 0 
      ? Math.round((presentados / totalVencimientosMes) * 100) 
      : 100;

    const fechaLimiteAlerta = new Date();
    fechaLimiteAlerta.setDate(hoy.getDate() + 5);
    const endDateStr = `${fechaLimiteAlerta.getFullYear()}-${String(fechaLimiteAlerta.getMonth() + 1).padStart(2, '0')}-${String(fechaLimiteAlerta.getDate()).padStart(2, '0')}`;

    let queryAlertas = supabase
      .from('vencimientos')
      .select(`
        id,
        fecha_limite,
        periodo_fiscal,
        estado_tarea,
        clientes!inner ( id, razon_social, nit, dv, contador_id, estado ),
        impuestos ( id, nombre, especialista_id )
      `)
      .neq('estado_tarea', 'PRESENTADO')
      .eq('clientes.estado', 'ACTIVO')
      .lte('fecha_limite', endDateStr) 
      .order('fecha_limite', { ascending: true });

    if (!esIngeniero) {
      queryAlertas = queryAlertas.or(`contador_id.eq.${usuarioId},especialista_id.eq.${usuarioId}`, { foreignTable: 'clientes' });
    }

    const { data: dataAlertas } = await queryAlertas;
    const alertasCriticas = (dataAlertas || []).slice(0, 5);

    const conteoPorCliente: { [key: string]: { nombre: string; pendientes: number } } = {};
    
    todosLosVencimientos.forEach((v) => {
      if (v.estado_tarea !== 'PRESENTADO') {
        const idCliente = v.clientes.id;
        if (!conteoPorCliente[idCliente]) {
          conteoPorCliente[idCliente] = { nombre: v.clientes.razon_social, pendientes: 0 };
        }
        conteoPorCliente[idCliente].pendientes += 1;
      }
    });

    const topClientesCarga = Object.values(conteoPorCliente)
      .sort((a, b) => b.pendientes - a.pendientes)
      .slice(0, 5);

    return {
      totalClientes: clientesAsignados.length,
      totalVencimientos: totalVencimientosMes,
      tareasPendientes: pendientes,
      porcentajeEfectividad: efectividad,
      alertasCriticas,
      topClientesCarga
    };
  },

  async getDistribucionImpuestos(): Promise<Array<{ id: string; nombre: string; periodicidad: string; empresasContadas: number }>> {
    const { data: impuestos, error: errImp } = await supabase
      .from("impuestos")
      .select("id, nombre, periodicidad")
      .is("eliminado", null);

    if (errImp) throw errImp;
    if (!impuestos) return [];

    const { data: relaciones, error: errRel } = await supabase
      .from("cliente_impuestos")
      .select("impuesto_id")
      .eq("estado", "ACTIVO")
      .is("eliminado", null);

    if (errRel) throw errRel;

    return impuestos.map(imp => {
      const conteo = relaciones?.filter(r => r.impuesto_id === imp.id).length || 0;
      return {
        id: imp.id,
        nombre: imp.nombre,
        periodicidad: imp.periodicidad,
        empresasContadas: conteo
      };
    });
  }
};