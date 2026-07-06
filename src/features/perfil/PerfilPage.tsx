import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { clientesService } from "../clientes/clientesService";
import type { ClienteConContador } from "../clientes/types";
import {
  UserCircle,
  Mail,
  Briefcase,
  ShieldCheck,
  Key,
  Save,
  Edit,
  Building2,
  FolderOpen,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export const PerfilPage = () => {
  const { perfil } = useAuth();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [correoNotif, setCorreoNotif] = useState("");
  const [loadingPass, setLoadingPass] = useState(false);
  const [loadingCorreo, setLoadingCorreo] = useState(false);
  const [mensajePass, setMensajePass] = useState({ tipo: "", texto: "" });
  const [mensajeCorreo, setMensajeCorreo] = useState({ tipo: "", texto: "" });

  const [misClientes, setMisClientes] = useState<ClienteConContador[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(true);

  useEffect(() => {
    if (perfil?.correo_notificacion) {
      setCorreoNotif(perfil.correo_notificacion);
    }
  }, [perfil]);

  useEffect(() => {
    const cargarMisClientes = async () => {
      if (!perfil?.id) return;
      try {
        setLoadingClientes(true);
        const todosLosClientes = await clientesService.getAll();
        const filtrados = todosLosClientes.filter(
          (c) => c.contador_id === perfil.id && c.estado === "ACTIVO",
        );
        setMisClientes(filtrados);
      } catch (error) {
        console.error("Error cargando portafolio de clientes:", error);
      } finally {
        setLoadingClientes(false);
      }
    };

    cargarMisClientes();
  }, [perfil?.id]);

  if (!perfil) return null;

  const handleActualizarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setMensajePass({
        tipo: "error",
        texto: "La nueva contraseña debe tener al menos 6 caracteres.",
      });
      return;
    }
    try {
      setLoadingPass(true);
      setMensajePass({ tipo: "", texto: "" });
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      setMensajePass({
        tipo: "exito",
        texto: "¡Contraseña actualizada con éxito!",
      });
      setNewPassword("");
    } catch (error: any) {
      setMensajePass({
        tipo: "error",
        texto: error.message || "Error al actualizar.",
      });
    } finally {
      setLoadingPass(false);
    }
  };

  const handleActualizarCorreoNotificacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correoNotif.trim() || !correoNotif.includes("@")) {
      setMensajeCorreo({
        tipo: "error",
        texto: "Por favor ingresa un correo electrónico válido.",
      });
      return;
    }
    try {
      setLoadingCorreo(true);
      setMensajeCorreo({ tipo: "", texto: "" });

      const { error } = await supabase
        .from("usuarios")
        .update({
          correo_notificacion: correoNotif.trim(),
          actualizado: new Date().toISOString(),
        })
        .eq("id", perfil.id);

      if (error) throw error;
      setMensajeCorreo({
        tipo: "exito",
        texto:
          "¡Correo de notificación guardado! (Reinicia la app para ver los cambios)",
      });
    } catch (error: any) {
      setMensajeCorreo({
        tipo: "error",
        texto: error.message || "Error al guardar el correo.",
      });
    } finally {
      setLoadingCorreo(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-title font-bold text-primary">
          Mi Perfil
        </h1>
        <p className="text-text-muted">
          Gestiona tus preferencias de notificación, seguridad y revisa tu
          portafolio asignado.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        <div className="bg-surface rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between">
          <div className="bg-primary/5 p-8 flex flex-col items-center justify-center text-center flex-1">
            <div className="w-24 h-24 bg-primary text-surface rounded-full flex items-center justify-center mb-4 shadow-md ring-4 ring-surface">
              <UserCircle className="w-16 h-16" />
            </div>
            <h2 className="text-2xl font-title font-bold text-primary">
              {perfil.nombre_completo}
            </h2>
            <span className="text-sm font-medium text-accent font-mono mt-1 bg-accent/10 px-2.5 py-0.5 rounded-full">
              @{perfil.username}
            </span>
          </div>

          <div className="p-6 space-y-4 bg-white border-t border-gray-100">
            <div className="flex items-center gap-3 text-text-main justify-center border-b border-gray-50 pb-4">
              <Briefcase className="w-4 h-4 text-text-muted shrink-0" />
              <div className="text-center">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                  Cargo en la Firma
                </p>
                <p className="text-sm font-semibold text-primary">
                  {perfil.cargo}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-text-main justify-center pt-2">
              <ShieldCheck className="w-4 h-4 text-text-muted shrink-0" />
              <div className="text-center">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                  Estado de la Cuenta
                </p>
                <p className="text-sm font-bold text-success flex items-center justify-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                  {perfil.estado}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 flex flex-col justify-between">
          <div className="bg-surface rounded-xl shadow-sm border border-gray-100 p-6 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Mail className="w-5 h-5 text-accent" />
                <h3 className="text-lg font-bold text-primary">
                  Canal de Notificaciones
                </h3>
              </div>
              <form
                onSubmit={handleActualizarCorreoNotificacion}
                className="space-y-4"
              >
                {mensajeCorreo.texto && (
                  <div
                    className={`p-3 rounded-md text-xs font-medium border ${mensajeCorreo.tipo === "exito" ? "bg-success/10 text-success border-success/20" : "bg-danger/10 text-danger border-danger/20"}`}
                  >
                    {mensajeCorreo.texto}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-1">
                    Correo Electrónico para Alertas
                  </label>
                  <input
                    type="email"
                    required
                    value={correoNotif}
                    onChange={(e) => setCorreoNotif(e.target.value)}
                    placeholder="ejemplo@correo.com"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-surface text-sm focus:ring-1 focus:ring-accent outline-none"
                  />
                  <p className="text-[10px] text-text-muted mt-1 leading-tight">
                    * Aquí recibirás las alertas de vencimiento. Tu correo de
                    inicio de sesión se mantiene oculto por seguridad.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={
                    loadingCorreo || correoNotif === perfil.correo_notificacion
                  }
                  className="w-full bg-primary hover:bg-primary/90 text-surface text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <Edit className="w-3.5 h-3.5" />
                  {loadingCorreo
                    ? "Guardando Correo..."
                    : "Actualizar Correo de Alertas"}
                </button>
              </form>
            </div>
          </div>

          <div className="bg-surface rounded-xl shadow-sm border border-gray-100 p-6 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Key className="w-5 h-5 text-accent" />
                <h3 className="text-lg font-bold text-primary">
                  Seguridad de la Cuenta
                </h3>
              </div>

              <form onSubmit={handleActualizarPassword} className="space-y-4">
                {mensajePass.texto && (
                  <div
                    className={`p-3 rounded-md text-sm font-medium border ${mensajePass.tipo === "exito" ? "bg-success/10 text-success border-success/20" : "bg-danger/10 text-danger border-danger/20"}`}
                  >
                    {mensajePass.texto}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-1">
                    Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Escribe tu nueva clave secreta..."
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-surface text-sm focus:ring-1 focus:ring-accent outline-none transition-all"
                  />
                  <p className="text-[10px] text-text-muted mt-1">
                    Usa al menos 6 caracteres. Te recomendamos combinar letras y
                    números.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loadingPass || !newPassword}
                  className="w-full bg-primary hover:bg-primary/90 text-surface text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  {loadingPass ? "Actualizando..." : "Actualizar Contraseña"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4 border-b border-gray-50 pb-3">
          <FolderOpen className="w-5 h-5 text-accent" />
          <div>
            <h3 className="text-lg font-bold text-primary">
              Mis Empresas Asignadas
            </h3>
            <p className="text-xs text-text-muted">
              Listado de clientes corporativos bajo tu responsabilidad directa.
            </p>
          </div>
        </div>

        {loadingClientes ? (
          <p className="text-sm text-text-muted text-center py-6 font-mono">
            Sincronizando archivo corporativo...
          </p>
        ) : misClientes.length === 0 ? (
          <div className="p-8 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200 space-y-1.5">
            <Building2 className="w-8 h-8 text-text-muted/40 mx-auto" />
            <p className="text-sm font-medium text-text-main">
              No registras clientes a tu cargo
            </p>
            <p className="text-xs text-text-muted">
              Si consideras que es un error, comunícate con la dirección o
              ingeniería.
            </p>
          </div>
        ) : (
          <div className="max-h-[296px] overflow-y-auto pr-1 space-y-3 scrollbar-thin">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {misClientes.map((cliente) => (
                <div
                  key={cliente.id}
                  onClick={() => navigate(`/clientes/${cliente.id}`)}
                  className="p-4 bg-gray-50 hover:bg-white border border-gray-100 hover:border-gray-200 rounded-xl flex items-center justify-between transition-all cursor-pointer shadow-2xs group h-[74px]"
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-9 h-9 rounded-lg bg-primary/5 text-primary flex items-center justify-center shrink-0 border border-primary/5 group-hover:bg-primary group-hover:text-surface transition-colors">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="truncate space-y-0.5">
                      <h4 className="text-sm font-bold text-primary truncate group-hover:text-accent transition-colors">
                        {cliente.razon_social}
                      </h4>
                      <p className="text-xs text-text-muted font-mono bg-gray-100 group-hover:bg-gray-50 px-2 py-0.5 rounded w-fit">
                        NIT: {cliente.nit}-{cliente.dv}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-text-muted group-hover:translate-x-1 group-hover:text-accent transition-all shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
