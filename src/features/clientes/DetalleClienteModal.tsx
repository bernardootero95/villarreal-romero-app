import {
  X,
  Building2,
  Mail,
  Phone,
  Shield,
  Hash,
  HelpCircle,
} from "lucide-react";
import type { ClienteConContador } from "./types";

interface DetalleClienteModalProps {
  cliente: ClienteConContador;
  onClose: () => void;
}

export const DetalleClienteModal = ({
  cliente,
  onClose,
}: DetalleClienteModalProps) => {
  return (
    <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera del Modal */}
        <div className="bg-primary p-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-surface">
            <Building2 className="w-5 h-5 text-accent" />
            <h2 className="font-title font-semibold truncate max-w-[320px]">
              {cliente.razon_social}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-surface/70 hover:text-surface transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Cuerpo de la Información */}
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-primary">
                {cliente.razon_social}
              </h3>
              <p className="text-xs text-text-muted uppercase tracking-wider font-semibold mt-0.5">
                Razón Social Registrada
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* NIT */}
            <div className="space-y-1">
              <span className="text-xs text-text-muted font-medium flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5" /> Identificación Fiscal
              </span>
              <p className="text-sm font-semibold text-text-main font-mono bg-gray-50 px-2.5 py-1.5 rounded-md border border-gray-100">
                {cliente.nit}-{cliente.dv}
              </p>
            </div>

            {/* Estado */}
            <div className="space-y-1">
              <span className="text-xs text-text-muted font-medium flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Estado Operativo
              </span>
              <div className="bg-gray-50 px-2.5 py-1.5 rounded-md border border-gray-100">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-bold ${cliente.estado === "ACTIVO" ? "text-success" : "text-danger"}`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${cliente.estado === "ACTIVO" ? "bg-success" : "bg-danger"}`}
                  />
                  {cliente.estado}
                </span>
              </div>
            </div>

            {/* Correo */}
            <div className="space-y-1 sm:col-span-2">
              <span className="text-xs text-text-muted font-medium flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Correo Electrónico de Contacto
              </span>
              <p className="text-sm text-text-main bg-gray-50 px-2.5 py-1.5 rounded-md border border-gray-100 truncate">
                {cliente.email || (
                  <span className="text-text-muted italic text-xs">
                    No registrado
                  </span>
                )}
              </p>
            </div>

            {/* Celular */}
            <div className="space-y-1">
              <span className="text-xs text-text-muted font-medium flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> Número Celular
              </span>
              <p className="text-sm text-text-main bg-gray-50 px-2.5 py-1.5 rounded-md border border-gray-100 font-mono">
                {cliente.celular || (
                  <span className="text-text-muted italic text-xs">
                    No registrado
                  </span>
                )}
              </p>
            </div>

            {/* Contador Asignado */}
            <div className="space-y-1">
              <span className="text-xs text-text-muted font-medium flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" /> Profesional Asignado
              </span>
              <p className="text-sm text-primary font-medium bg-gray-50 px-2.5 py-1.5 rounded-md border border-gray-100 truncate">
                {cliente.usuarios?.nombre_completo || "Sin asignar"}
              </p>
            </div>
          </div>
        </div>

        {/* Footer del Modal */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-text-muted hover:bg-gray-200 rounded-md transition-colors font-medium"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  );
};
