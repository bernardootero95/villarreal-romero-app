import { supabase } from "../../lib/supabase";
import type {
  FiltrosInformeData,
  MetricaCumplimientoCliente,
  MetricaCargaEquipo,
} from "./types";

export const informesService = {
  async getCumplimientoClientes(
    filtros: FiltrosInformeData,
  ): Promise<MetricaCumplimientoCliente[]> {
    let query = supabase
      .from("vencimientos")
      .select(
        `
        id,
        fecha_limite,
        estado_tarea,
        clientes!inner (id, razon_social, nit)
      `,
      )
      .gte("fecha_limite", filtros.fechaInicio)
      .lte("fecha_limite", filtros.fechaFin);

    if (filtros.clienteId && filtros.clienteId !== "") {
      query = query.eq("cliente_id", filtros.clienteId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const hoyStr = new Date().toISOString().split("T")[0];
    const mapaClientes: Record<string, MetricaCumplimientoCliente> = {};

    (data || []).forEach((item: any) => {
      const cliente = item.clientes;
      if (!mapaClientes[cliente.id]) {
        mapaClientes[cliente.id] = {
          cliente_id: cliente.id,
          razon_social: cliente.razon_social,
          nit: cliente.nit,
          total_vencimientos: 0,
          presentados: 0,
          pendientes: 0,
          vencidos: 0,
          porcentaje_cumplimiento: 0,
        };
      }

      const metrica = mapaClientes[cliente.id];
      metrica.total_vencimientos += 1;

      if (item.estado_tarea === "PRESENTADO") {
        metrica.presentados += 1;
      } else if (item.fecha_limite < hoyStr) {
        metrica.vencidos += 1;
      } else {
        metrica.pendientes += 1;
      }
    });

    return Object.values(mapaClientes).map((m) => ({
      ...m,
      porcentaje_cumplimiento:
        m.total_vencimientos > 0
          ? Math.round((m.presentados / m.total_vencimientos) * 100)
          : 0,
    }));
  },

  async getCargaEquipo(
    filtros: FiltrosInformeData,
  ): Promise<MetricaCargaEquipo[]> {
    
    const [
      { data: usuarios, error: errUsu },
      { data: tareas, error: errTar },
      { data: vencimientos, error: errVto },
    ] = await Promise.all([
      supabase
        .from("usuarios")
        .select("id, nombre_completo, cargo")
        .eq("estado", "ACTIVO")
        .is("eliminado", null),
      supabase
        .from("tareas")
        .select("id, usuario_id, estado, fecha_limite")
        .is("eliminado", null)
        .gte("fecha_limite", filtros.fechaInicio)
        .lte("fecha_limite", filtros.fechaFin),
      supabase
        .from("vencimientos")
        .select(
          `
          id,
          fecha_limite,
          estado_tarea,
          clientes (contador_id),
          impuestos (especialista_id)
        `,
        )
        .gte("fecha_limite", filtros.fechaInicio)
        .lte("fecha_limite", filtros.fechaFin),
    ]);

    if (errUsu) throw errUsu;
    if (errTar) throw errTar;
    if (errVto) throw errVto;

    const hoyStr = new Date().toISOString().split("T")[0];
    const mapaEquipo: Record<string, MetricaCargaEquipo> = {};

    (usuarios || []).forEach((u: any) => {
      mapaEquipo[u.id] = {
        usuario_id: u.id,
        nombre_completo: u.nombre_completo,
        cargo: u.cargo,
        tareas_pendientes: 0,
        tareas_completadas: 0,
        tareas_vencidas: 0,
        vencimientos_pendientes: 0,
        vencimientos_presentados: 0,
        vencimientos_vencidos: 0,
        total_carga_activa: 0,
      };
    });

    (tareas || []).forEach((t: any) => {
      const miembro = mapaEquipo[t.usuario_id];
      if (!miembro) return;

      if (t.estado === "COMPLETADA") {
        miembro.tareas_completadas += 1;
      } else if (t.fecha_limite < hoyStr) {
        miembro.tareas_vencidas += 1;
      } else {
        miembro.tareas_pendientes += 1;
      }
    });

    
    (vencimientos || []).forEach((v: any) => {
      const responsables = new Set<string>();
      if (v.clientes?.contador_id) responsables.add(v.clientes.contador_id);
      if (v.impuestos?.especialista_id)
        responsables.add(v.impuestos.especialista_id);

      responsables.forEach((userId) => {
        const miembro = mapaEquipo[userId];
        if (!miembro) return;

        if (v.estado_tarea === "PRESENTADO") {
          miembro.vencimientos_presentados += 1;
        } else if (v.fecha_limite < hoyStr) {
          miembro.vencimientos_vencidos += 1;
        } else {
          miembro.vencimientos_pendientes += 1;
        }
      });
    });

  
    return Object.values(mapaEquipo).map((m) => ({
      ...m,
      total_carga_activa:
        m.tareas_pendientes +
        m.tareas_vencidas +
        m.vencimientos_pendientes +
        m.vencimientos_vencidos,
    }));
  },
};