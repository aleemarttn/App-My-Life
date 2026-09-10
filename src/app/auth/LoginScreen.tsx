import { useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "@/core/supabase/client";
import { Button } from "@/core/ui/Button";

/**
 * Acceso con email y contrasena. Sin registro ni recuperacion: la app es
 * de un solo usuario (D4) y la cuenta se crea una vez desde el panel de
 * Supabase. Anadir onboarding aqui seria construir producto, no la app.
 */

/** Los mensajes de supabase-js vienen en ingles y son crípticos. */
function mensajeDeError(bruto: string): string {
  if (/invalid login credentials/i.test(bruto)) {
    return "Email o contraseña incorrectos.";
  }
  if (/email not confirmed/i.test(bruto)) {
    return "La cuenta existe pero el email no está confirmado.";
  }
  if (/failed to fetch|network/i.test(bruto)) {
    return "Sin conexión. Para entrar la primera vez hace falta red.";
  }
  return bruto;
}

const CAMPO =
  "h-touch-primary w-full rounded-button border border-border bg-surface-2 px-4 " +
  // 16 px es obligatorio: por debajo, iOS hace zoom al enfocar el campo.
  "text-body text-text placeholder:text-text-faint " +
  "focus:border-accent focus:outline-none";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);

    const { error: fallo } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    // Si el login va bien no se toca el estado: onAuthStateChange desmonta
    // esta pantalla. Tocarlo provocaria un aviso de update en desmontado.
    if (fallo) {
      setError(mensajeDeError(fallo.message));
      setEnviando(false);
    }
  }

  return (
    <div className="pt-safe pb-safe flex min-h-dvh flex-col justify-center bg-bg px-4">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="text-title-lg text-text">My Life</h1>
        <p className="text-body mt-1 mb-8 text-text-muted">
          Entra para sincronizar tus registros.
        </p>

        <form onSubmit={alEnviar} className="space-y-3">
          <div>
            <label htmlFor="email" className="text-label mb-1.5 block text-text-muted">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              inputMode="email"
              autoCapitalize="none"
              required
              className={CAMPO}
            />
          </div>

          <div>
            <label htmlFor="password" className="text-label mb-1.5 block text-text-muted">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className={CAMPO}
            />
          </div>

          {error && (
            <p role="alert" className="text-label rounded-button bg-surface-2 p-3 text-danger">
              {error}
            </p>
          )}

          <Button type="submit" disabled={enviando} className="!mt-6">
            {enviando ? "Entrando…" : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
