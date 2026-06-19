import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { clientesService } from "../clientes/clientesService";
import {
  vencimientosService,
  type Vencimiento,
} from "../calendario/vencimientosService";
import {
  Building2,
  CalendarDays,
  Clock,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

export const DashboardPage = () => {
  const { perfil } = useAuth();
  const [totalClientes, setTotalClientes] = useState(0);
  const [proximosVencimientos, setProximosVencimientos] = useState<
    Vencimiento[]
  >([]);
  const [estadisticasMes, setEstadisticasMes] = useState({
    pendientes: 0,
    presentados: 0,
    vencidos: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarDashboard = async () => {
      if (!perfil) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const hoy = new Date();

        // 1. Cargar Clientes Totales
        const clientes = await clientesService.getAll();
        setTotalClientes(clientes.filter((c) => c.estado === "ACTIVO").length);

        // 2. Cargar Vencimientos del Mes Actual
        const vencimientosMes = await vencimientosService.getVencimientosMes(
          hoy.getFullYear(),
          hoy.getMonth(),
          perfil.id,
          perfil.cargo,
        );

        // 3. Calcular Estadísticas
        let pendientes = 0;
        let presentados = 0;
        let vencidos = 0;

        const proximos: Vencimiento[] = [];

        vencimientosMes.forEach((v) => {
          if (v.estado_tarea === "PRESENTADO") {
            presentados++;
          } else if (
            v.estado_tarea === "VENCIDO" ||
            (v.estado_tarea === "PENDIENTE" &&
              new Date(v.fecha_limite + "T23:59:59") < hoy)
          ) {
            vencidos++;
          } else {
            pendientes++;
            proximos.push(v);
          }
        });

        setEstadisticasMes({ pendientes, presentados, vencidos });

        proximos.sort(
          (a, b) =>
            new Date(a.fecha_limite).getTime() -
            new Date(b.fecha_limite).getTime(),
        );
        setProximosVencimientos(proximos.slice(0, 5));
      } catch (error) {
        console.error("Error cargando el dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarDashboard();
  }, [perfil]);

  if (loading) {
    return (
      <div className="p-8 text-center text-text-muted animate-pulse">
        Cargando métricas de Villarreal-Romero...
      </div>
    );
  }

  const porcentajeCumplimiento =
    estadisticasMes.presentados +
      estadisticasMes.pendientes +
      estadisticasMes.vencidos ===
    0
      ? 0
      : Math.round(
          (estadisticasMes.presentados /
            (estadisticasMes.presentados +
              estadisticasMes.pendientes +
              estadisticasMes.vencidos)) *
            100,
        );

  // EXTRACCIÓN SEGURA DEL NOMBRE
  const primerNombre = perfil?.nombre_completo?.split(" ")[0] || "Equipo";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-title font-bold text-primary">
          ¡Hola, {primerNombre}!
        </h1>
        <p className="text-text-muted">
          Este es el resumen de tus operaciones para este mes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-muted">
              Empresas Activas
            </p>
            <h3 className="text-2xl font-bold text-primary">{totalClientes}</h3>
          </div>
        </div>

        <div className="bg-surface p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-muted">
              Tareas Pendientes
            </p>
            <h3 className="text-2xl font-bold text-text-main">
              {estadisticasMes.pendientes}
            </h3>
          </div>
        </div>

        <div className="bg-surface p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6 text-success" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-muted">Presentados</p>
            <h3 className="text-2xl font-bold text-text-main">
              {estadisticasMes.presentados}
            </h3>
          </div>
        </div>

        <div className="bg-surface p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
            <CalendarDays className="w-6 h-6 text-accent" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-muted">
              Cumplimiento
            </p>
            <h3 className="text-2xl font-bold text-primary">
              {porcentajeCumplimiento}%
            </h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-title font-bold text-primary">
              Próximos Vencimientos a tu cargo
            </h3>
            <Link
              to="/calendario"
              className="text-xs font-semibold text-accent hover:text-primary transition-colors flex items-center gap-1"
            >
              Ver Calendario <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="p-4 flex-1">
            {proximosVencimientos.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-text-muted space-y-2 py-8">
                <CheckCircle className="w-12 h-12 text-gray-300" />
                <p className="text-sm font-medium">
                  No hay tareas urgentes próximas a vencer.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {proximosVencimientos.map((tarea) => {
                  const diasFaltantes = Math.ceil(
                    (new Date(tarea.fecha_limite).getTime() -
                      new Date().getTime()) /
                      (1000 * 3600 * 24),
                  );

                  return (
                    <div
                      key={tarea.id}
                      className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <div
                        className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center shrink-0 ${diasFaltantes <= 3 ? "bg-danger/10 text-danger" : "bg-primary/5 text-primary"}`}
                      >
                        <span className="text-[10px] font-bold uppercase">
                          {new Date(
                            tarea.fecha_limite + "T12:00:00",
                          ).toLocaleDateString("es-CO", { month: "short" })}
                        </span>
                        <span className="text-lg font-black leading-none">
                          {new Date(tarea.fecha_limite + "T12:00:00").getDate()}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-text-main text-sm truncate">
                          {tarea.clientes.razon_social}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-semibold bg-gray-100 text-text-muted px-1.5 py-0.5 rounded">
                            {tarea.impuestos.nombre} ({tarea.periodo_fiscal})
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`text-xs font-bold ${diasFaltantes <= 3 ? "text-danger flex items-center gap-1" : "text-text-muted"}`}
                        >
                          {diasFaltantes <= 3 && (
                            <AlertTriangle className="w-3 h-3" />
                          )}
                          Faltan {diasFaltantes} días
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="bg-danger/5 rounded-xl border border-danger/20 p-5 flex flex-col justify-center items-center text-center">
          <AlertTriangle className="w-12 h-12 text-danger mb-3" />
          <h3 className="font-title font-bold text-danger text-lg">
            Alertas Críticas
          </h3>
          <p className="text-sm text-danger/80 mt-2">
            Tienes{" "}
            <span className="font-black text-xl">
              {estadisticasMes.vencidos}
            </span>{" "}
            obligaciones vencidas este mes.
          </p>
          {estadisticasMes.vencidos > 0 && (
            <Link
              to="/calendario"
              className="mt-4 bg-danger text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-danger/90 transition-colors"
            >
              Ir a resolverlas
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
