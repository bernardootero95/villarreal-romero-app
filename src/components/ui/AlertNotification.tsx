import React, { useEffect } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  X,
} from "lucide-react";

// Tipos de alertas permitidas en el dominio de Villarreal-Romero
export type AlertType = "success" | "warning" | "error" | "info";

interface AlertNotificationProps {
  type: AlertType;
  title: string;
  message: string;
  onClose?: () => void;
  autoCloseDuration?: number; // Duración en milisegundos para auto-cierre (opcional)
}

export const AlertNotification = ({
  type,
  title,
  message,
  onClose,
  autoCloseDuration,
}: AlertNotificationProps) => {
  // Lógica SOLID: Gestión aislada del ciclo de vida del auto-cierre sin afectar el renderizado
  useEffect(() => {
    if (!autoCloseDuration || !onClose) return;

    const timer = setTimeout(() => {
      onClose();
    }, autoCloseDuration);

    return () => clearTimeout(timer);
  }, [autoCloseDuration, onClose]);

  // Diccionario estratégico de estilos mapeando tus tokens corporativos y semánticos
  const alertStyles: Record<
    AlertType,
    { container: string; icon: React.ReactNode; iconColor: string }
  > = {
    success: {
      container:
        "bg-success/10 border-success/30 text-text-main text-success-dark",
      icon: <CheckCircle2 className="w-5 h-5" />,
      iconColor: "text-success",
    },
    warning: {
      container:
        "bg-amber-500/10 border-amber-500/30 text-text-main text-amber-700",
      icon: <AlertTriangle className="w-5 h-5" />,
      iconColor: "text-amber-600",
    },
    error: {
      container:
        "bg-danger/10 border-danger/30 text-text-main text-danger-dark",
      icon: <AlertCircle className="w-5 h-5" />,
      iconColor: "text-danger",
    },
    info: {
      // Utiliza los tonos de énfasis de la firma basados en tu archivo CSS corporativo
      container:
        "bg-[var(--accent-bg)] border-[var(--accent-border)] text-text-main",
      icon: <Info className="w-5 h-5" />,
      iconColor: "text-[var(--accent)]",
    },
  };

  const currentStyle = alertStyles[type] || alertStyles.info;

  return (
    <div
      role="alert"
      className={`w-full p-4 border rounded-xl flex items-start gap-3.5 transition-all animate-in fade-in slide-in-from-top-2 duration-200 shadow-2xs ${currentStyle.container}`}
    >
      {/* Icono de Estado Semántico */}
      <div className={`shrink-0 mt-0.5 ${currentStyle.iconColor}`}>
        {currentStyle.icon}
      </div>

      {/* Cuerpo de la Alerta */}
      <div className="flex-1 space-y-0.5">
        <h4 className="text-sm font-title font-bold tracking-wide uppercase text-primary">
          {title}
        </h4>
        <p className="text-xs leading-relaxed text-text-muted">{message}</p>
      </div>

      {/* Gatillo de Cierre Manual */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-text-muted hover:text-primary p-1 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
          aria-label="Cerrar alerta"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
