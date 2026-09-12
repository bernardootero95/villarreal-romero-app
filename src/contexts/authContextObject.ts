import { createContext, useContext } from "react";
import type { Session, User } from "@supabase/supabase-js";
import type { Usuario } from "../features/usuarios/types";

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  perfil: Usuario | null;
  signOut: () => Promise<void>;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  perfil: null,
  signOut: async () => {},
  isLoading: true,
});

export const useAuth = () => useContext(AuthContext);
