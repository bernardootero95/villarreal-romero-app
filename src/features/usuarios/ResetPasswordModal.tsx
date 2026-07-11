import { useState } from "react";
import {
  X,
  KeyRound,
  Eye,
  EyeOff,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import { useForzarPassword } from "./useUsuarios";
import type { Usuario } from "./types";
import { AlertNotification } from "../../components/ui/AlertNotification";

interface ResetPasswordModalProps {
  usuario: Usuario;
  onClose: () => void;
}

export const ResetPasswordModal = ({
  usuario,
  onClose,
}: ResetPasswordModalProps) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorValidation, setErrorValidation] = useState<string | null>(null);
  const [cambioExitoso, setCambioExitoso] = useState(false);

  const forcePasswordMutation = useForzarPassword();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorValidation(null);

    if (password.length < 6) {
      setErrorValidation(
        "La nueva contraseña provisional debe tener mínimo 6 caracteres.",
      );
      return;
    }

    forcePasswordMutation.mutate(
      { usuarioId: usuario.id, nuevaClave: password },
      {
        onSuccess: () => {
          setCambioExitoso(true);
        },
        onError: (err: any) => {
          setErrorValidation(
            err.message || "Error al procesar el cambio de credenciales.",
          );
        },
      },
    );
  };

  const isSubmitting = forcePasswordMutation.isPending;

  return (
    <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-gray-200">
        <div className="bg-primary p-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-surface">
            <KeyRound className="w-5 h-5 text-accent" />
            <h2 className="font-title font-semibold text-sm">
              Rescate Técnico de Clave
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-surface/70 hover:text-surface transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {cambioExitoso ? (
          <div className="p-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <CheckCircle2 className="w-12 h-12 text-success mx-auto stroke-[1.5]" />
            <div className="space-y-1">
              <h3 className="font-title font-bold text-primary text-base">
                ¡Contraseña Sobreescrita!
              </h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Las credenciales de{" "}
                <span className="font-semibold text-text-main">
                  "{usuario.nombre_completo}"
                </span>{" "}
                se han actualizado con éxito en la bódvda de Supabase.
              </p>
            </div>
            <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg text-xs font-medium text-text-main">
              Por favor indícales su nueva clave de acceso de forma verbal o un
              canal seguro:{" "}
              <span className="font-mono font-bold text-primary block mt-1 text-sm">
                {password}
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-full bg-primary hover:bg-primary/90 text-surface text-xs font-semibold py-2 rounded-md cursor-pointer transition-all"
            >
              Entendido y Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-lg flex gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-tight">
                Estás forzando el cambio de credenciales de{" "}
                <span className="font-bold">"{usuario.nombre_completo}"</span>.
                Como la plataforma opera con correos simulados, deberás
                entregarle la clave nueva manualmente.
              </p>
            </div>

            {errorValidation && (
              <div className="animate-in fade-in duration-200">
                <AlertNotification
                  type="error"
                  title="Error de Validación"
                  message={errorValidation}
                  onClose={() => setErrorValidation(null)}
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-bold text-text-muted uppercase">
                Contraseña Nueva
              </label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Escribe la clave de reemplazo..."
                  className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md bg-gray-50 focus:bg-surface text-sm focus:ring-1 focus:ring-accent outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-text-muted hover:bg-gray-100 rounded-md text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !password}
                className="bg-primary hover:bg-primary/90 text-surface font-semibold px-5 py-2 rounded-md text-xs flex items-center gap-1.5 transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? "Sobreescribiendo..." : "Actualizar Contraseña"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
