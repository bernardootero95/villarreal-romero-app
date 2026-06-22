import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Shield,
  Hash,
  Briefcase,
  ExternalLink,
  Calendar,
  AlertCircle,
  Clock,
} from "lucide-react";
import type { ClienteConContador } from "./types";
import {
  vencimientosService,
  type Vencimiento,
} from "../calendario/vencimientosService";

interface DetalleClientePageProps {
  cliente: ClienteConContador;
  onBack: () => void;
}

export const DetalleClientePage = ({
  cliente,
  onBack,
}: DetalleClientePageProps) => {
  const [vencimientos, setVencimientos] = useState<Vencimiento[]>([]);
  const [loadingVencimientos, setLoadingVencimientos] = useState(true);

  // Carga de vencimientos del cliente para el mes en curso de forma asíncrona y aislada
  useEffect(() => {
    const cargarVencimientosCliente = async () => {
      try {
        setLoadingVencimientos(true);
        const hoy = new Date();
        // Consumimos el servicio reutilizando la lógica base filtrada
        const data = await vencimientosService.getVencimientosMes(
          hoy.getFullYear(),
          hoy.getMonth(),
          "", // No pasamos ID de usuario para que el filtrado por cliente sea total si eres administrador/responsable
          "Gerente", // Forzamos bypass administrativo para ver todo el espectro de este cliente
        );

        // Filtramos en memoria únicamente las obligaciones de ESTE cliente
        const filtrados = data.filter((v) => v.clientes.id === cliente.id);
        setVencimientos(filtrados);
      } catch (error) {
        console.error("Error al cargar los vencimientos del cliente:", error);
      } finally {
        setLoadingVencimientos(false);
      }
    };

    cargarVencimientosCliente();
  }, [cliente.id]);

  // Helper para asignar estilos visuales según el estado de la tarea tributaria
  const getBadgeStyles = (estado: string) => {
    switch (estado) {
      case "PRESENTADO":
        return "bg-success/10 text-success border-success/20";
      case "REVISIÓN":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "VENCIDO":
        return "bg-danger/10 text-danger border-danger/20 animate-pulse";
      default:
        return "bg-primary/10 text-primary border-primary/20";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Botón de Retorno de Flujo */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-medium text-text-muted hover:text-primary transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Volver
      </button>

      {/* Encabezado Principal de la Ficha Técnica */}
      <div className="card-container flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 border border-primary/5">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-title font-bold text-primary">
              {cliente.razon_social}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${
              cliente.estado === "ACTIVO"
                ? "bg-success/10 text-success border-success/20"
                : "bg-danger/10 text-danger border-danger/20"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${cliente.estado === "ACTIVO" ? "bg-success" : "bg-danger"}`}
            />
            CLIENTE {cliente.estado}
          </span>
        </div>
      </div>

      {/* Grid de Secciones de Dos Columnas (2/3 de info, 1/3 de vencimientos) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Bloque Izquierdo: Ficha de Identificación Fiscal y Contacto */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card-container bg-surface p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-title font-semibold text-primary mb-4 border-b border-gray-100 pb-2">
                Información Legal y Tributaria
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <span className="text-xs text-text-muted font-medium flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5" /> Número de Identificación
                    Tributaria (NIT)
                  </span>
                  <p className="text-base font-semibold text-text-main font-mono bg-gray-50 px-3 py-2 rounded-md border border-gray-100">
                    {cliente.nit}-{cliente.dv}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-text-muted font-medium flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" /> Profesional Contable
                    Responsable
                  </span>
                  <p className="text-base font-medium text-primary bg-gray-50 px-3 py-2 rounded-md border border-gray-100 truncate">
                    {cliente.usuarios?.nombre_completo ||
                      "Sin asignar profesional"}
                  </p>
                </div>
              </div>
            </div>

            {/* Área de Canales de Comunicación */}
            <div>
              <h3 className="text-lg font-title font-semibold text-primary mb-4 border-b border-gray-100 pb-2">
                Canales Oficiales de Contacto
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <span className="text-xs text-text-muted font-medium flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> Correo de Notificación
                    Facturación / DIAN
                  </span>
                  <p className="text-sm font-medium text-text-main bg-gray-50 px-3 py-2 rounded-md border border-gray-100 truncate">
                    {cliente.email || (
                      <span className="text-text-muted italic text-xs">
                        No parametrizado
                      </span>
                    )}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-text-muted font-medium flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> Línea de Contacto Móvil
                  </span>
                  <p className="text-sm font-semibold text-text-main bg-gray-50 px-3 py-2 rounded-md border border-gray-100 font-mono">
                    {cliente.celular || (
                      <span className="text-text-muted italic text-xs">
                        No parametrizado
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* ESPACIO RESERVADO CONTENEDOR PARA FUTURAS OPCIONES */}
            <div className="p-6 border border-dashed border-gray-200 rounded-xl bg-gray-50/50 flex flex-col items-center justify-center text-center min-h-[160px]">
              <ExternalLink className="w-8 h-8 text-text-muted mb-2 stroke-[1.5]" />
              <h4 className="text-sm font-semibold text-text-main">
                Módulos Complementarios Próximos
              </h4>
              <p className="text-xs text-text-muted max-w-sm mt-1">
                Este bloque está aislado y optimizado arquitectónicamente para
                integrar el historial de logs de WhatsApp y cobros dinámicos.
              </p>
            </div>
          </div>
        </div>

        {/* Bloque Derecho: Próximos Vencimientos del Cliente */}
        <div className="card-container bg-surface p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Clock className="w-5 h-5 text-primary" />
            <h3 className="text-base font-title font-semibold text-primary">
              Próximos Vencimientos
            </h3>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {loadingVencimientos ? (
              <p className="text-xs text-text-muted text-center py-4">
                Cargando obligaciones fiscales...
              </p>
            ) : vencimientos.length === 0 ? (
              <div className="text-center py-6 text-text-muted space-y-1">
                <AlertCircle className="w-8 h-8 text-text-muted/60 mx-auto stroke-[1.5]" />
                <p className="text-xs font-medium">
                  Sin obligaciones este mes.
                </p>
              </div>
            ) : (
              vencimientos.map((vencimiento) => (
                <div
                  key={vencimiento.id}
                  className="p-3.5 bg-gray-50 rounded-lg border border-gray-100 space-y-2.5 hover:shadow-sm transition-all"
                >
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-xs font-bold text-primary font-title line-clamp-2 flex-1">
                      {vencimiento.impuestos.nombre}
                    </h4>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${getBadgeStyles(vencimiento.estado_tarea)}`}
                    >
                      {vencimiento.estado_tarea}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-text-muted font-mono pt-1 border-t border-gray-200/60">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-text-muted" />
                      {new Date(vencimiento.fecha_limite).toLocaleDateString(
                        "es-CO",
                        { timeZone: "UTC" },
                      )}
                    </span>
                    <span className="bg-primary/5 text-primary px-1.5 py-0.5 rounded text-[10px] font-bold">
                      Per: {vencimiento.periodo_fiscal}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
