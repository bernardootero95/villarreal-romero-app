import { supabase } from "../../lib/supabase";
import type {
  FiltrosInformeData,
  MetricaVencimientosEmpleado,
  MetricaVencimientosImpuesto,
} from "./types";

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
          clientes (contador_id),
          impuestos (especialista_id)
        `,
        )
        .gte("fecha_limite", filtros.fechaInicio)
        .lte("fecha_limite", filtros.fechaFin),
    ]);

    if (errUsu) throw errUsu;
    if (errVto) throw errVto;

    const hoyStr = new Date().toISOString().split("T")[0];
    const mapaEmpleados: Record<string, MetricaVencimientosEmpleado> = {};

    (usuarios || []).forEach((u: any) => {
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

    (vencimientos || []).forEach((v: any) => {
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
            ? v.actualizado.split("T")[0]
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
        .select("id, fecha_limite, estado_tarea, actualizado, impuesto_id")
        .gte("fecha_limite", filtros.fechaInicio)
        .lte("fecha_limite", filtros.fechaFin),
    ]);

    if (errImp) throw errImp;
    if (errVto) throw errVto;

    const hoyStr = new Date().toISOString().split("T")[0];
    const mapaImpuestos: Record<string, MetricaVencimientosImpuesto> = {};

    (impuestos || []).forEach((imp: any) => {
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

    (vencimientos || []).forEach((v: any) => {
      const imp = mapaImpuestos[v.impuesto_id];
      if (!imp) return;

      imp.total_vencimientos += 1;

      if (v.estado_tarea === "PRESENTADO") {
        const fechaRadicacion = v.actualizado
          ? v.actualizado.split("T")[0]
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
};