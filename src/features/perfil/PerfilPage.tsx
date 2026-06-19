import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import {
  UserCircle,
  Mail,
  Briefcase,
  ShieldCheck,
  Key,
  Save,
} from "lucide-react";

export const PerfilPage = () => {
  const { perfil, session } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });

  if (!perfil) return null;

  const handleActualizarPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      setMensaje({
        tipo: "error",
        texto: "La nueva contraseña debe tener al menos 6 caracteres.",
      });
      return;
    }

    try {
      setLoading(true);
      setMensaje({ tipo: "", texto: "" });

      // Actualizamos la contraseña directamente en la bóveda de Supabase
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setMensaje({
        tipo: "exito",
        texto: "¡Tu contraseña ha sido actualizada correctamente!",
      });
      setNewPassword("");
    } catch (error: any) {
      setMensaje({
        tipo: "error",
        texto: error.message || "Error al actualizar la contraseña.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-title font-bold text-primary">
          Mi Perfil
        </h1>
        <p className="text-text-muted">
          Gestiona tu información personal y credenciales de acceso.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* TARJETA 1: INFORMACIÓN DEL USUARIO */}
        <div className="bg-surface rounded-xl shadow-sm border border-gray-100 overflow-hidden h-fit">
          <div className="bg-primary/5 p-6 flex flex-col items-center justify-center border-b border-gray-100">
            <div className="w-20 h-20 bg-primary text-surface rounded-full flex items-center justify-center mb-4 shadow-md">
              <UserCircle className="w-12 h-12" />
            </div>
            <h2 className="text-xl font-bold text-primary">
              {perfil.nombre_completo}
            </h2>
            <span className="text-sm font-medium text-text-muted">
              @{perfil.username}
            </span>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 text-text-main">
              <div className="w-8 h-8 rounded bg-gray-50 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-text-muted" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-text-muted uppercase">
                  Correo Electrónico
                </p>
                <p className="text-sm font-medium">{perfil.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-text-main">
              <div className="w-8 h-8 rounded bg-gray-50 flex items-center justify-center shrink-0">
                <Briefcase className="w-4 h-4 text-text-muted" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-text-muted uppercase">
                  Cargo en la Firma
                </p>
                <p className="text-sm font-medium">{perfil.cargo}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-text-main">
              <div className="w-8 h-8 rounded bg-gray-50 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-text-muted" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-text-muted uppercase">
                  Estado de la Cuenta
                </p>
                <p className="text-sm font-bold text-success flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-success"></span>
                  {perfil.estado}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* TARJETA 2: CAMBIO DE CONTRASEÑA */}
        <div className="bg-surface rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Key className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-bold text-primary">
              Seguridad de la Cuenta
            </h3>
          </div>

          <form onSubmit={handleActualizarPassword} className="space-y-4">
            {mensaje.texto && (
              <div
                className={`p-3 rounded-md text-sm font-medium border ${mensaje.tipo === "exito" ? "bg-success/10 text-success border-success/20" : "bg-danger/10 text-danger border-danger/20"}`}
              >
                {mensaje.texto}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-text-main mb-1">
                Nueva Contraseña
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Escribe tu nueva clave secreta..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-surface text-sm focus:ring-2 focus:ring-accent outline-none transition-all"
              />
              <p className="text-[11px] text-text-muted mt-1.5">
                Usa al menos 6 caracteres. Te recomendamos combinar letras y
                números.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !newPassword}
              className="w-full bg-primary hover:bg-primary/90 text-surface font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-6 shadow-sm"
            >
              <Save className="w-4 h-4" />
              {loading ? "Actualizando..." : "Actualizar Contraseña"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
