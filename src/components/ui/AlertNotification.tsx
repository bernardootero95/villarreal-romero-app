import React, { useEffect } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  X,
} from "lucide-react";

export type AlertType = "success" | "warning" | "error" | "info";

interface AlertNotificationProps {
  type: AlertType;
  title: string;
  message: string;
  onClose?: () => void;
  autoCloseDuration?: number;
}

export const AlertNotification = ({
  type,
  title,
  message,
  onClose,
  autoCloseDuration,
}: AlertNotificationProps) => {
  useEffect(() => {
    if (!autoCloseDuration || !onClose) return;

    const timer = setTimeout(() => {
      onClose();
    }, autoCloseDuration);

    return () => clearTimeout(timer);
  }, [autoCloseDuration, onClose]);

  const alertStyles: Record<
    AlertType,
    { container: string; icon: React.ReactNode; iconColor: string }
  > = {
    success: {
      container: "bg-success/10 border-success/30 text-text-main",
      icon: <CheckCircle2 className="w-5 h-5" />,
      iconColor: "text-success",
    },
    warning: {
      container: "bg-warning/10 border-warning/30 text-text-main",
      icon: <AlertTriangle className="w-5 h-5" />,
      iconColor: "text-warning",
    },
    error: {
      container: "bg-danger/10 border-danger/30 text-text-main",
      icon: <AlertCircle className="w-5 h-5" />,
      iconColor: "text-danger",
    },
    info: {
      container: "bg-primary/10 border-primary/30 text-text-main",
      icon: <Info className="w-5 h-5" />,
      iconColor: "text-primary",
    },
  };

  const currentStyle = alertStyles[type] || alertStyles.info;

  return (
    <div
      role="alert"
      className={`w-full p-4 border rounded-xl flex items-start gap-3.5 transition-all animate-in fade-in slide-in-from-top-2 duration-200 shadow-sm ${currentStyle.container}`}
    >
      <div className={`shrink-0 mt-0.5 ${currentStyle.iconColor}`}>
        {currentStyle.icon}
      </div>

      <div className="flex-1 space-y-0.5">
        <h4 className="text-sm font-title font-bold tracking-wide uppercase text-primary">
          {title}
        </h4>
        <p className="text-xs leading-relaxed text-text-muted">{message}</p>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-text-muted hover:text-primary p-1 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          aria-label="Cerrar alerta"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
