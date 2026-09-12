import { supabase } from "../../lib/supabase";
import type {
  FiltrosInformeData,
  MetricaVencimientosEmpleado,
  MetricaVencimientosImpuesto,
  ResumenDetalleEmpleado,
  DetalleVencimientoEmpleado,
  ResumenDetalleImpuesto,
  DetalleVencimientoImpuesto,
  ClasificacionVencimiento,
} from "./types";

interface UsuarioBasico {
  id: string;
  nombre_completo: string;
  cargo: string;
}

interface UsuarioNombre {
  id: string;
  nombre_completo: string;
}

interface ImpuestoBasico {
  id: string;
  nombre: string;
  periodicidad: string;
}

interface VencimientoRawEmpleado {
  fecha_limite: string;
  estado_tarea: string;
  actualizado: string | null;
  clientes: { contador_id: string | null };
  impuestos: { especialista_id: string | null };
}

interface VencimientoRawImpuesto {
  impuesto_id: string;
  fecha_limite: string;
  estado_tarea: string;
  actualizado: string | null;
}

interface VencimientoDetalleEmpleadoRaw {
  id: string;
  fecha_limite: string;
  estado_tarea: string;
  actualizado: string | null;
  periodo_fiscal: string;
  observaciones: string | null;
  clientes: { contador_id: string | null; razon_social: string; nit: string; dv: number };
  impuestos: { especialista_id: string | null; nombre: string };
}

interface VencimientoDetalleImpuestoRaw {
  id: string;
  fecha_limite: string;
  estado_tarea: string;
  actualizado: string | null;
  periodo_fiscal: string;
  observaciones: string | null;
  clientes: { contador_id: string | null; razon_social: string; nit: string; dv: number };
}

// Colombia no observa horario de verano, pero usamos Intl con timeZone explícito
// en vez de un offset fijo para evitar depender de eso.
const obtenerFechaLocal = (fecha: Date | string = new Date()): string =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(
    typeof fecha === "string" ? new Date(fecha) : fecha,
  );

export const informesService = {
  async getVencimientosPorEmpleado(
    filtros: FiltrosInformeData,
  ): Promise<MetricaVencimientosEmpleado[]> {
    let queryUsuarios = supabase
      .from("usuarios")
      .select("id, nombre_completo, cargo")
      .eq("estado", "ACTIVO")
      .is("eliminado", null);

    if (filtros.usuarioId && filtros.usuarioId !== "") {
      queryUsuarios = queryUsuarios.eq("id", filtros.usuarioId);
    }

    const [
      { data: usuarios, error: errUsu },
      { data: vencimientos, error: errVto },
    ] = await Promise.all([
      queryUsuarios,
      supabase
        .from("vencimientos")
        .select(
          `
          id,
          fecha_limite,
          estado_tarea,
          actualizado,
          clientes!inner (contador_id, estado, eliminado),
          impuestos!inner (especialista_id, estado, eliminado)
        `,
        )
        .eq("clientes.estado", "ACTIVO")
        .is("clientes.eliminado", null)
        .eq("impuestos.estado", "ACTIVO")
        .is("impuestos.eliminado", null)
        .gte("fecha_limite", filtros.fechaInicio)
        .lte("fecha_limite", filtros.fechaFin),
    ]);

    if (errUsu) throw errUsu;
    if (errVto) throw errVto;

    const hoyStr = obtenerFechaLocal();
    const mapaEmpleados: Record<string, MetricaVencimientosEmpleado> = {};

    (usuarios || []).forEach((u: UsuarioBasico) => {
      mapaEmpleados[u.id] = {
        usuario_id: u.id,
        nombre_completo: u.nombre_completo,
        cargo: u.cargo,
        total_vencimientos: 0,
        presentados_a_tiempo: 0,
        presentados_tarde: 0,
        pendientes: 0,
        vencidos: 0,
        porcentaje_efectividad: 0,
      };
    });

    ((vencimientos || []) as unknown as VencimientoRawEmpleado[]).forEach((v) => {
      const responsables = new Set<string>();
      if (v.clientes?.contador_id) responsables.add(v.clientes.contador_id);
      if (v.impuestos?.especialista_id)
        responsables.add(v.impuestos.especialista_id);

      responsables.forEach((userId) => {
        const empleado = mapaEmpleados[userId];
        if (!empleado) return;

        empleado.total_vencimientos += 1;

        if (v.estado_tarea === "PRESENTADO") {
          const fechaRadicacion = v.actualizado
            ? obtenerFechaLocal(v.actualizado)
            : hoyStr;

          if (fechaRadicacion <= v.fecha_limite) {
            empleado.presentados_a_tiempo += 1;
          } else {
            empleado.presentados_tarde += 1;
          }
        } else if (v.fecha_limite < hoyStr) {
          empleado.vencidos += 1;
        } else {
          empleado.pendientes += 1;
        }
      });
    });

    return Object.values(mapaEmpleados).map((emp) => {
      const totalPresentados = emp.presentados_a_tiempo + emp.presentados_tarde;
      return {
        ...emp,
        porcentaje_efectividad:
          emp.total_vencimientos > 0
            ? Math.round((totalPresentados / emp.total_vencimientos) * 100)
            : 0,
      };
    });
  },

  async getVencimientosPorImpuesto(
    filtros: FiltrosInformeData,
  ): Promise<MetricaVencimientosImpuesto[]> {
    let queryImpuestos = supabase
      .from("impuestos")
      .select("id, nombre, periodicidad")
      .eq("estado", "ACTIVO")
      .is("eliminado", null);

    if (filtros.impuestoId && filtros.impuestoId !== "") {
      queryImpuestos = queryImpuestos.eq("id", filtros.impuestoId);
    }

    const [
      { data: impuestos, error: errImp },
      { data: vencimientos, error: errVto },
    ] = await Promise.all([
      queryImpuestos,
      supabase
        .from("vencimientos")
        .select(`
          id, 
          fecha_limite, 
          estado_tarea, 
          actualizado, 
          impuesto_id,
          clientes!inner (estado, eliminado),
          impuestos!inner (estado, eliminado)
        `)
        .eq("clientes.estado", "ACTIVO")
        .is("clientes.eliminado", null)
        .eq("impuestos.estado", "ACTIVO")
        .is("impuestos.eliminado", null)
        .gte("fecha_limite", filtros.fechaInicio)
        .lte("fecha_limite", filtros.fechaFin),
    ]);

    if (errImp) throw errImp;
    if (errVto) throw errVto;

    const hoyStr = obtenerFechaLocal();
    const mapaImpuestos: Record<string, MetricaVencimientosImpuesto> = {};

    (impuestos || []).forEach((imp: ImpuestoBasico) => {
      mapaImpuestos[imp.id] = {
        impuesto_id: imp.id,
        nombre: imp.nombre,
        periodicidad: imp.periodicidad,
        total_vencimientos: 0,
        presentados_a_tiempo: 0,
        presentados_tarde: 0,
        pendientes: 0,
        vencidos: 0,
        porcentaje_efectividad: 0,
      };
    });

    (vencimientos || []).forEach((v: VencimientoRawImpuesto) => {
      const imp = mapaImpuestos[v.impuesto_id];
      if (!imp) return;

      imp.total_vencimientos += 1;

      if (v.estado_tarea === "PRESENTADO") {
        const fechaRadicacion = v.actualizado
          ? obtenerFechaLocal(v.actualizado)
          : hoyStr;

        if (fechaRadicacion <= v.fecha_limite) {
          imp.presentados_a_tiempo += 1;
        } else {
          imp.presentados_tarde += 1;
        }
      } else if (v.fecha_limite < hoyStr) {
        imp.vencidos += 1;
      } else {
        imp.pendientes += 1;
      }
    });

    return Object.values(mapaImpuestos).map((imp) => {
      const totalPresentados = imp.presentados_a_tiempo + imp.presentados_tarde;
      return {
        ...imp,
        porcentaje_efectividad:
          imp.total_vencimientos > 0
            ? Math.round((totalPresentados / imp.total_vencimientos) * 100)
            : 0,
      };
    });
  },

  async getDetalleEmpleado(
    usuarioId: string,
    fechaInicio: string,
    fechaFin: string,
  ): Promise<ResumenDetalleEmpleado> {
    const [
      { data: usuario, error: errUsu },
      { data: vencimientos, error: errVto },
    ] = await Promise.all([
      supabase
        .from("usuarios")
        .select("id, nombre_completo, cargo")
        .eq("id", usuarioId)
        .single(),
      supabase
        .from("vencimientos")
        .select(
          `
          id,
          fecha_limite,
          estado_tarea,
          actualizado,
          periodo_fiscal,
          observaciones,
          clientes!inner (contador_id, razon_social, nit, dv, estado, eliminado),
          impuestos!inner (especialista_id, nombre, estado, eliminado)
        `,
        )
        .eq("clientes.estado", "ACTIVO")
        .is("clientes.eliminado", null)
        .eq("impuestos.estado", "ACTIVO")
        .is("impuestos.eliminado", null)
        .gte("fecha_limite", fechaInicio)
        .lte("fecha_limite", fechaFin),
    ]);

    if (errUsu) throw errUsu;
    if (errVto) throw errVto;

    const hoyStr = obtenerFechaLocal();

    const asignados = ((vencimientos || []) as unknown as VencimientoDetalleEmpleadoRaw[]).filter(
      (v) =>
        v.clientes?.contador_id === usuarioId ||
        v.impuestos?.especialista_id === usuarioId,
    );

    let a_tiempo = 0;
    let tarde = 0;
    let pendientes = 0;
    let vencidos = 0;

    const items: DetalleVencimientoEmpleado[] = asignados.map((v) => {
      const fechaRadicacion = v.actualizado ? obtenerFechaLocal(v.actualizado) : null;
      let clasificacion: ClasificacionVencimiento;

      if (v.estado_tarea === "PRESENTADO") {
        const rad = fechaRadicacion || hoyStr;
        if (rad <= v.fecha_limite) {
          clasificacion = "A_TIEMPO";
          a_tiempo++;
        } else {
          clasificacion = "TARDE";
          tarde++;
        }
      } else if (v.fecha_limite < hoyStr) {
        clasificacion = "VENCIDO";
        vencidos++;
      } else {
        clasificacion = "PENDIENTE";
        pendientes++;
      }

      return {
        id: v.id,
        razon_social: v.clientes.razon_social,
        nit: v.clientes.nit,
        dv: v.clientes.dv,
        impuesto_nombre: v.impuestos.nombre,
        periodo_fiscal: v.periodo_fiscal,
        fecha_limite: v.fecha_limite,
        estado_tarea: v.estado_tarea,
        fecha_radicacion: fechaRadicacion,
        observaciones: v.observaciones,
        clasificacion,
      };
    });

    const total = items.length;
    const totalPresentados = a_tiempo + tarde;
    const efectividad =
      total > 0 ? Math.round((totalPresentados / total) * 100) : 0;

    items.sort((a, b) => a.fecha_limite.localeCompare(b.fecha_limite));

    return {
      usuario: {
        id: usuario.id,
        nombre_completo: usuario.nombre_completo,
        cargo: usuario.cargo,
      },
      metricas: {
        total,
        a_tiempo,
        tarde,
        pendientes,
        vencidos,
        efectividad,
      },
      items,
    };
  },

  async getDetalleImpuesto(
    impuestoId: string,
    fechaInicio: string,
    fechaFin: string,
  ): Promise<ResumenDetalleImpuesto> {
    const [
      { data: impuesto, error: errImp },
      { data: vencimientos, error: errVto },
      { data: usuarios, error: errUsu },
    ] = await Promise.all([
      supabase
        .from("impuestos")
        .select("id, nombre, periodicidad")
        .eq("id", impuestoId)
        .single(),
      supabase
        .from("vencimientos")
        .select(
          `
          id,
          fecha_limite,
          estado_tarea,
          actualizado,
          periodo_fiscal,
          observaciones,
          clientes!inner (contador_id, razon_social, nit, dv, estado, eliminado),
          impuestos!inner (estado, eliminado)
        `,
        )
        .eq("impuesto_id", impuestoId)
        .eq("clientes.estado", "ACTIVO")
        .is("clientes.eliminado", null)
        .eq("impuestos.estado", "ACTIVO")
        .is("impuestos.eliminado", null)
        .gte("fecha_limite", fechaInicio)
        .lte("fecha_limite", fechaFin),
      supabase.from("usuarios").select("id, nombre_completo"),
    ]);

    if (errImp) throw errImp;
    if (errVto) throw errVto;
    if (errUsu) throw errUsu;

    const mapaUsuarios: Record<string, string> = {};
    (usuarios || []).forEach((u: UsuarioNombre) => {
      mapaUsuarios[u.id] = u.nombre_completo;
    });

    const hoyStr = obtenerFechaLocal();

    let a_tiempo = 0;
    let tarde = 0;
    let pendientes = 0;
    let vencidos = 0;

    const items: DetalleVencimientoImpuesto[] = ((vencimientos || []) as unknown as VencimientoDetalleImpuestoRaw[]).map(
      (v) => {
        const fechaRadicacion = v.actualizado
          ? obtenerFechaLocal(v.actualizado)
          : null;
        let clasificacion: ClasificacionVencimiento;

        if (v.estado_tarea === "PRESENTADO") {
          const rad = fechaRadicacion || hoyStr;
          if (rad <= v.fecha_limite) {
            clasificacion = "A_TIEMPO";
            a_tiempo++;
          } else {
            clasificacion = "TARDE";
            tarde++;
          }
        } else if (v.fecha_limite < hoyStr) {
          clasificacion = "VENCIDO";
          vencidos++;
        } else {
          clasificacion = "PENDIENTE";
          pendientes++;
        }

        const contadorId = v.clientes.contador_id;
        const contadorNombre = contadorId
          ? mapaUsuarios[contadorId] || "Sin asignar"
          : "Sin asignar";

        return {
          id: v.id,
          razon_social: v.clientes.razon_social,
          nit: v.clientes.nit,
          dv: v.clientes.dv,
          contador_nombre: contadorNombre,
          periodo_fiscal: v.periodo_fiscal,
          fecha_limite: v.fecha_limite,
          estado_tarea: v.estado_tarea,
          fecha_radicacion: fechaRadicacion,
          observaciones: v.observaciones,
          clasificacion,
        };
      },
    );

    const total = items.length;
    const totalPresentados = a_tiempo + tarde;
    const efectividad =
      total > 0 ? Math.round((totalPresentados / total) * 100) : 0;

    items.sort((a, b) => a.fecha_limite.localeCompare(b.fecha_limite));

    return {
      impuesto: {
        id: impuesto.id,
        nombre: impuesto.nombre,
        periodicidad: impuesto.periodicidad,
      },
      metricas: {
        total,
        a_tiempo,
        tarde,
        pendientes,
        vencidos,
        efectividad,
      },
      items,
    };
  },
};