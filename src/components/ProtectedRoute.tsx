import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  cargosPermitidos?: string[];
}

export const ProtectedRoute = ({
  children,
  cargosPermitidos,
}: ProtectedRouteProps) => {
  const { session, perfil, isLoading } = useAuth();

  // Spinner de carga mientras valida sesión y perfil
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  // Si no hay sesión activa, al login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Si la ruta es restringida y el cargo del usuario no está permitido, redirige al Dashboard
  if (cargosPermitidos && perfil && !cargosPermitidos.includes(perfil.cargo)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
