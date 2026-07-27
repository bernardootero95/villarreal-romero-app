import { supabase } from "../../lib/supabase";
import type {
  FiltrosInformeData,
  MetricaVencimientosEmpleado,
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

    
    return Object.values(mapaEmpleados).map((emp) => ({
      ...emp,
      porcentaje_efectividad:
        emp.total_vencimientos > 0
          ? Math.round((emp.presentados_a_tiempo / emp.total_vencimientos) * 100)
          : 0,
    }));
  },
};