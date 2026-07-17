import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Usuario } from "../features/usuarios/types";
import { useInactividad } from "../hooks/useInactividad"; // <-- Importamos el controlador de inactividad

interface AuthContextType {
  session: Session | null;
  user: User | null;
  perfil: Usuario | null;
  signOut: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  perfil: null,
  signOut: async () => {},
  isLoading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const queryClient = useQueryClient();

  const cargarPerfil = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setPerfil(data as Usuario);
    } catch (error) {
      console.error("Error cargando el perfil del usuario:", error);
      setPerfil(null);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await cargarPerfil(session.user.id);
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await cargarPerfil(session.user.id);
      } else {
        setPerfil(null);
        if (event === "SIGNED_OUT") {
          queryClient.clear();
        }
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  // Se estabiliza la referencia de la función para evitar re-renderizados del hook de inactividad
  const signOut = useCallback(async () => {
    queryClient.clear();
    await supabase.auth.signOut();
  }, [queryClient]);

  // Cierre de sesión automático si no se detecta interacción del usuario en 15 minutos
  useInactividad(() => {
    if (session) {
      console.warn("Cerrando sesión por inactividad operativa.");
      signOut();
    }
  }, 15);

  return (
    <AuthContext.Provider value={{ session, user, perfil, signOut, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
