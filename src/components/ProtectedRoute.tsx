import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { session, isLoading } = useAuth();

  // Mientras se verifica el estado de la sesión, mostramos un spinner con el color de acento
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  // Si no está autenticado, se le redirige al login de inmediato
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
