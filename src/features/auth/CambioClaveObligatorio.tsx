import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { ShieldCheck, Lock, LogOut } from "lucide-react";

export const CambioClaveObligatorio = () => {
  const { actualizarContrasena, logout } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      return setError("La nueva contraseña debe tener al menos 6 caracteres.");
    }

    if (password !== confirmPassword) {
      return setError("Las contraseñas no coinciden.");
    }

    try {
      setLoading(true);
      await actualizarContrasena(password);
      alert("¡Contraseña actualizada con éxito! Bienvenido al sistema.");
    } catch (err: any) {
      setError(err.message || "No se pudo actualizar la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary/5 flex items-center justify-center p-4">
      <div className="bg-surface w-full max-w-md rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-primary p-6 text-center text-surface space-y-2">
          <ShieldCheck className="w-12 h-12 text-accent mx-auto animate-pulse" />
          <h2 className="font-title font-bold text-xl">
            Seguridad Obligatoria
          </h2>
          <p className="text-xs text-surface/70">
            Detectamos que esta es tu primera vez en el sistema. Por seguridad,
            debes cambiar tu clave temporal.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-danger/10 border border-danger/20 text-danger text-xs p-3 rounded-md font-medium">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-text-muted uppercase">
              Nueva Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digita tu clave privada..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md bg-surface text-sm focus:ring-1 focus:ring-accent outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-text-muted uppercase">
              Confirmar Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu clave privada..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md bg-surface text-sm focus:ring-1 focus:ring-accent outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-accent/90 text-primary font-bold py-2.5 rounded-md shadow transition-all disabled:opacity-50 mt-4"
          >
            {loading ? "Actualizando Bóveda..." : "Guardar y Activar Cuenta"}
          </button>

          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-text-muted hover:text-danger pt-2 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Cancelar e Iniciar Sesión con
            otra cuenta
          </button>
        </form>
      </div>
    </div>
  );
};
