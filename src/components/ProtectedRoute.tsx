import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Loader } from "./Loader";

interface ProtectedRouteProps {
  children: ReactNode;
  cargosPermitidos?: string[];
}

export const ProtectedRoute = ({
  children,
  cargosPermitidos,
}: ProtectedRouteProps) => {
  const { session, perfil, isLoading } = useAuth();

  if (isLoading) {
    return <Loader fullScreen texto="Verificando sesión..." />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (cargosPermitidos && perfil && !cargosPermitidos.includes(perfil.cargo)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
