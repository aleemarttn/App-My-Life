import { RouterProvider } from "react-router";
import { LoginScreen } from "./auth/LoginScreen";
import { useAuth } from "./auth/useAuth";
import { router } from "./router";
import { useSyncLifecycle } from "./useSyncLifecycle";

/**
 * Decide que ve el usuario segun haya sesion o no.
 *
 * El router entero cuelga de aqui, asi que sin sesion no hay ni rutas: no
 * existe forma de llegar a una pantalla de datos escribiendo la URL a mano.
 *
 * El estado de carga dura lo que tarda en leerse la sesion del almacenamiento
 * local, no una llamada de red: unos milisegundos. Se pinta el fondo y nada
 * mas, para que no haya destello blanco ni salto de maquetacion. Nada de
 * spinner (docs/design.md §8).
 */
export function AuthGate() {
  const { session, loading } = useAuth();
  useSyncLifecycle();

  if (loading) {
    return <div className="min-h-dvh bg-bg" />;
  }

  return session ? <RouterProvider router={router} /> : <LoginScreen />;
}
