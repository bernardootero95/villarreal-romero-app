import { supabase } from "../../lib/supabase";
import { vencimientosService } from "../calendario/vencimientosService";

export type ModoVistaDashboard = "GLOBAL" | "PERSONAL";

export interface AlertaCritica {
  id: string;
  fecha_limite: string;
  periodo_fiscal: string;
  estado_tarea: string;
  clientes: { id: string; razon_social: string; contador_id: string };
  impuestos: { id: string; nombre: string; especialista_id: string | null };
}

export const dashboardService = {
  async getMetricasContador(
    usuarioId: string,
    cargo: string,
    vista: ModoVistaDashboard = "PERSONAL"
  ) {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = hoy.getMonth();

    // Determinar si debemos aplicar visión total de la firma
    const esRolDirectivo = ["Gerente", "Ingeniero"].includes(cargo);
    const aplicarVistaGlobal = esRolDirectivo && vista === "GLOBAL";

    // 1. Conteo de clientes activos asignados (solo el número, sin traer la tabla completa)
    //    y vencimientos del mes, en paralelo.
    let queryConteoClientes = supabase
      .from("clientes")
      .select("*", { count: "exact", head: true })
      .eq("estado", "ACTIVO")
      .is("eliminado", null);

    if (!aplicarVistaGlobal) {
      queryConteoClientes = queryConteoClientes.eq("contador_id", usuarioId);
    }

    const [{ count: totalClientesAsignados, error: errClientes }, todosLosVencimientos] = await Promise.all([
      queryConteoClientes,
      vencimientosService.getVencimientosMes(
        anio,
        mes,
        usuarioId,
        aplicarVistaGlobal ? "Ingeniero" : "Contador" // Forzamos al servicio a traer todo si es global, o solo lo propio si es personal
      ),
    ]);

    if (errClientes) throw errClientes;

    // 3. Filtrado de Vencimientos y cálculo de efectividad
    // Si la vista es personal, nos aseguramos de que solo pasen los donde el usuario es contador o especialista
    const vencimientosFiltrados = todosLosVencimientos.filter((v) => {
      if (aplicarVistaGlobal) return true;
      const esContador = v.clientes?.contador_id === usuarioId;
      const esEspecialista = v.impuestos?.especialista_id === usuarioId;
      return esContador || esEspecialista;
    });

    const totalVencimientosMes = vencimientosFiltrados.length;
    const pendientes = vencimientosFiltrados.filter(
      (v) => v.estado_tarea === "PENDIENTE" || v.estado_tarea === "REVISIÓN"
    ).length;
    const presentados = vencimientosFiltrados.filter(
      (v) => v.estado_tarea === "PRESENTADO"
    ).length;

    const efectividad =
      totalVencimientosMes > 0
        ? Math.round((presentados / totalVencimientosMes) * 100)
        : 100;

    // 4. Consulta blindada de Alertas Críticas (Próximos 5 días o vencidos)
    const fechaLimiteAlerta = new Date();
    fechaLimiteAlerta.setDate(hoy.getDate() + 5);
    const endDateStr = `${fechaLimiteAlerta.getFullYear()}-${String(fechaLimiteAlerta.getMonth() + 1).padStart(2, "0")}-${String(fechaLimiteAlerta.getDate()).padStart(2, "0")}`;

    const queryAlertas = supabase
      .from("vencimientos")
      .select(
        `
        id,
        fecha_limite,
        periodo_fiscal,
        estado_tarea,
        clientes!inner (id, razon_social, nit, dv, contador_id, estado, eliminado),
        impuestos!inner (id, nombre, especialista_id, estado, eliminado)
      `
      )
      .neq("estado_tarea", "PRESENTADO")
      .eq("clientes.estado", "ACTIVO")
      .is("clientes.eliminado", null)
      .eq("impuestos.estado", "ACTIVO")
      .is("impuestos.eliminado", null)
      .lte("fecha_limite", endDateStr)
      .order("fecha_limite", { ascending: true });

    const { data: dataAlertas, error: errAlertas } = await queryAlertas;
    if (errAlertas) throw errAlertas;

    // Filtramos las alertas en memoria según el modo de vista seleccionado
    const alertasCrudas = ((dataAlertas as unknown as AlertaCritica[] | null) || []).filter((v) => {
      if (aplicarVistaGlobal) return true;
      return (
        v.clientes.contador_id === usuarioId ||
        v.impuestos.especialista_id === usuarioId
      );
    });

    const alertasCriticas = alertasCrudas.slice(0, 5);

    // 5. Cálculo del Top 5 Clientes con Mayor Carga Operativa
    const conteoPorCliente: Record<
      string,
      { nombre: string; pendientes: number }
    > = {};

    vencimientosFiltrados.forEach((v) => {
      if (v.estado_tarea !== "PRESENTADO" && v.clientes?.id) {
        const idCliente = v.clientes.id;
        if (!conteoPorCliente[idCliente]) {
          conteoPorCliente[idCliente] = {
            nombre: v.clientes.razon_social,
            pendientes: 0,
          };
        }
        conteoPorCliente[idCliente].pendientes += 1;
      }
    });

    const topClientesCarga = Object.values(conteoPorCliente)
      .sort((a, b) => b.pendientes - a.pendientes)
      .slice(0, 5);

    return {
      totalClientes: totalClientesAsignados || 0,
      totalVencimientos: totalVencimientosMes,
      tareasPendientes: pendientes,
      porcentajeEfectividad: efectividad,
      alertasCriticas,
      topClientesCarga,
    };
  },

  async getDistribucionImpuestos(): Promise<
    Array<{
      id: string;
      nombre: string;
      periodicidad: string;
      empresasContadas: number;
    }>
  > {
    const { data: impuestos, error: errImp } = await supabase
      .from("impuestos")
      .select("id, nombre, periodicidad")
      .eq("estado", "ACTIVO")
      .is("eliminado", null);

    if (errImp) throw errImp;
    if (!impuestos) return [];

    const { data: relaciones, error: errRel } = await supabase
      .from("cliente_impuestos")
      .select("impuesto_id")
      .eq("estado", "ACTIVO")
      .is("eliminado", null);

    if (errRel) throw errRel;

    return impuestos.map((imp) => {
      const conteo =
        relaciones?.filter((r) => r.impuesto_id === imp.id).length || 0;
      return {
        id: imp.id,
        nombre: imp.nombre,
        periodicidad: imp.periodicidad,
        empresasContadas: conteo,
      };
    });
  },
};