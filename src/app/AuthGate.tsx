import { DesignCheck } from "./DesignCheck";
import { LoginScreen } from "./auth/LoginScreen";
import { useAuth } from "./auth/useAuth";

/**
 * Decide que ve el usuario segun haya sesion o no.
 *
 * El estado de carga dura lo que tarda en leerse la sesion del
 * almacenamiento local, no una llamada de red: unos milisegundos. Se pinta
 * el fondo y nada mas, para que no haya un destello blanco ni un salto de
 * maquetacion. Nada de spinner (docs/design.md §8).
 */
export function AuthGate() {
  const { session, loading } = useAuth();

  if (loading) {
    return <div className="min-h-dvh bg-bg" />;
  }

  return session ? <DesignCheck /> : <LoginScreen />;
}
