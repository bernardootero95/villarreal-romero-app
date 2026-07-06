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

    const alertasCriticas = todosLosVencimientos
      .filter((v) => {
        if (v.estado_tarea === 'PRESENTADO') return false;
        const fechaVencimiento = new Date(v.fecha_limite + "T00:00:00");
        const fechaHoyPlana = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        return fechaVencimiento >= fechaHoyPlana && fechaVencimiento <= fechaLimiteAlerta;
      })
      .sort((a, b) => new Date(a.fecha_limite).getTime() - new Date(b.fecha_limite).getTime())
      .slice(0, 5);

    
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