import { AuthGate } from "./AuthGate";
import { AuthProvider } from "./auth/AuthProvider";

/**
 * Raiz de la aplicacion. De momento solo monta el contexto de sesion;
 * el router y el AppShell entran en el punto 8 de docs/estado.md.
 */
export function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
