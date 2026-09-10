import { useContext } from "react";
import { AuthContext } from "./authContext";
import type { AuthState } from "./authContext";

export function useAuth(): AuthState {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error("useAuth solo puede usarse dentro de <AuthProvider>");
  }
  return contexto;
}
