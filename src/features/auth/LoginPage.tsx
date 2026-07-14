import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "../../lib/supabase";
import { Lock, User as UserIcon, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Loader } from "../../components/Loader";
import { AlertNotification } from "../../components/ui/AlertNotification";
import logo from "../../assets/LOGO-2.png";

const loginSchema = z.object({
  username: z.string().min(4, "El usuario es requerido"),
  password: z.string().min(6, "La contraseña es obligatoria"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { session } = useAuth();

  useEffect(() => {
    if (session) {
      navigate("/", { replace: true });
    }
  }, [session, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setAuthError(null);

    const internalEmail = `${data.username.toLowerCase().trim()}@villarreal-romero.local`;

    const { error } = await supabase.auth.signInWithPassword({
      email: internalEmail,
      password: data.password,
    });

    if (error) {
      setAuthError(
        "Credenciales incorrectas. Verifica tu usuario y contraseña de acceso corporativo.",
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {isLoading && (
        <Loader
          texto="Verificando credenciales de acceso..."
          fullScreen={true}
        />
      )}

      <div className="card-container w-full max-w-md">
        <div className="text-center mb-8 flex flex-col items-center">
          <img
            src={logo}
            alt="Logo Villarreal-Romero"
            className="h-20 w-auto mb-4 object-contain"
          />
          <h1 className="text-2xl font-title font-semibold text-primary">
            Villarreal-Romero
          </h1>
          <p className="text-text-muted mt-1 font-body text-sm">
            Sistema de Gestión y Vencimientos
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {authError && (
            <div className="animate-in fade-in duration-200">
              <AlertNotification
                type="error"
                title="Error de Autenticación"
                message={authError}
                onClose={() => setAuthError(null)}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-main mb-1">
              Usuario
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-text-muted" />
              </div>
              <input
                type="text"
                {...register("username")}
                disabled={isLoading}
                className={`block w-full pl-10 pr-3 py-2 border ${
                  errors.username ? "border-danger" : "border-gray-300"
                } rounded-md focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent sm:text-sm transition-colors bg-surface`}
                placeholder="jromero"
              />
            </div>
            {errors.username && (
              <p className="mt-1 text-sm text-danger">
                {errors.username.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-main mb-1">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-text-muted" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                {...register("password")}
                disabled={isLoading}
                className={`block w-full pl-10 pr-10 py-2 border ${
                  errors.password ? "border-danger" : "border-gray-300"
                } rounded-md focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent sm:text-sm transition-colors bg-surface`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={isLoading}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-primary transition-colors focus:outline-none cursor-pointer"
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-danger">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-surface bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {isLoading ? "Iniciando sesión..." : "Ingresar al sistema"}
          </button>
        </form>
      </div>
    </div>
  );
};
