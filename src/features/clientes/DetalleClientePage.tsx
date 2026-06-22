import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Shield,
  Hash,
  Calendar,
  Briefcase,
  ExternalLink,
} from "lucide-react";
import type { ClienteConContador } from "./types";

interface DetalleClientePageProps {
  cliente: ClienteConContador;
  onBack: () => void;
}

export const DetalleClientePage = ({
  cliente,
  onBack,
}: DetalleClientePageProps) => {
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

      {/* Grid de Secciones: Preparado para escalabilidad vertical y horizontal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bloque Izquierdo: Ficha de Identificación Fiscal */}
        <div className="card-container lg:col-span-2 space-y-6">
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

          {/* ESPACIO RESERVADO CONTENEDOR PARA FUTURAS OPCIONES (Pestañas, Logs, Historiales) */}
          <div className="p-6 border border-dashed border-gray-200 rounded-xl bg-gray-50/50 flex flex-col items-center justify-center text-center min-h-[160px]">
            <ExternalLink className="w-8 h-8 text-text-muted mb-2 stroke-[1.5]" />
            <h4 className="text-sm font-semibold text-text-main">
              Módulos Complementarios Próximos
            </h4>
            <p className="text-xs text-text-muted max-w-sm mt-1">
              Este bloque está aislado y optimizado arquitectónicamente para
              integrar el historial de logs de WhatsApp, cobros e impuestos
              dinámicos del cliente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
