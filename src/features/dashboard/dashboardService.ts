import { supabase } from "../../lib/supabase";
import { vencimientosService } from "../calendario/vencimientosService";
import { clientesService } from "../clientes/clientesService";

export type ModoVistaDashboard = "GLOBAL" | "PERSONAL";

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

    // 1. Descarga en paralelo de clientes y vencimientos del mes
    const [todosLosClientes, todosLosVencimientos] = await Promise.all([
      clientesService.getAll(),
      vencimientosService.getVencimientosMes(
        anio,
        mes,
        usuarioId,
        aplicarVistaGlobal ? "Ingeniero" : "Contador" // Forzamos al servicio a traer todo si es global, o solo lo propio si es personal
      ),
    ]);

    // 2. Filtrado estricto de clientes activos asignados según el modo de vista
    const clientesAsignados = todosLosClientes.filter((c) => {
      if (c.estado !== "ACTIVO" || c.eliminado !== null) return false;
      if (aplicarVistaGlobal) return true;
      return c.contador_id === usuarioId;
    });

    // 3. Filtrado de Vencimientos y cálculo de efectividad
    // Si la vista es personal, nos aseguramos de que solo pasen los donde el usuario es contador o especialista
    const vencimientosFiltrados = todosLosVencimientos.filter((v: any) => {
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

    let queryAlertas = supabase
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
    const alertasCrudas = (dataAlertas || []).filter((v: any) => {
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

    vencimientosFiltrados.forEach((v: any) => {
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
      totalClientes: clientesAsignados.length,
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