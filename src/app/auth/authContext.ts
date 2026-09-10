import { createContext } from "react";
import type { Session } from "@supabase/supabase-js";

export interface AuthState {
  /** null = no hay sesion. */
  session: Session | null;
  /** true mientras se resuelve la sesion guardada al arrancar. */
  loading: boolean;
}

/**
 * En archivo propio para que AuthProvider.tsx exporte solo el componente
 * y useAuth.ts solo el hook: asi no salta react/only-export-components y,
 * mas importante, no se rompe el refresco en caliente al editar el provider.
 */
export const AuthContext = createContext<AuthState | null>(null);
