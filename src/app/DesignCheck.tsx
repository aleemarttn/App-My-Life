import { supabase } from "@/core/supabase/client";
import { Button } from "@/core/ui/Button";
import { useAuth } from "./auth/useAuth";

/**
 * Pantalla de verificacion del sistema de diseno.
 *
 * PROVISIONAL: existe solo para contrastar en pantalla los tokens de
 * docs/design.md §2-§5 contra el lienzo de wireframes antes de construir
 * el shell real. Se sustituye por AppShell + router en el punto 8 del
 * pendiente de docs/estado.md.
 */

const COLORES = [
  ["--color-bg", "#0B0C0E", "fondo de la app"],
  ["--color-surface", "#16181C", "tarjetas"],
  ["--color-surface-2", "#202329", "elevado, inputs, chips"],
  ["--color-border", "#2A2E36", "separadores de 1px"],
  ["--color-text", "#F2F4F7", "texto primario"],
  ["--color-text-muted", "#9BA3AF", "secundario, etiquetas"],
  ["--color-text-faint", "#626B78", "solo marcas de eje"],
  ["--color-accent", "#4ADE80", "accion primaria"],
  ["--color-accent-press", "#22C55E", "estado pulsado"],
  ["--color-danger", "#F87171", "alertas, desvios"],
  ["--color-warning", "#FBBF24", "umbrales proximos"],
  ["--color-info", "#60A5FA", "serie secundaria"],
] as const;

const TIPOGRAFIA = [
  ["text-display", "48 / 52 · 700", "105,5"],
  ["text-title-lg", "28 / 34 · 600", "15 kg × 15 reps"],
  ["text-title", "20 / 26 · 600", "Sentadilla"],
  ["text-body", "16 / 24 · 400", "Texto general de la app"],
  ["text-label", "14 / 20 · 500", "Serie 1 de 2"],
  ["text-caption", "12 / 16 · 400", "12 sep · RIR 2"],
] as const;

export function DesignCheck() {
  const { session } = useAuth();
  const email = session?.user.email ?? "";
  const iniciales = email.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-dvh bg-bg text-text">
      {/* Cabecera: titulo + avatar de Perfil (D11). Aun sin navegacion. */}
      <header className="pt-safe sticky top-0 z-10 border-b border-border bg-bg/90 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-title">My Life</h1>
          <button
            type="button"
            aria-label="Perfil"
            className="size-touch grid place-items-center rounded-chip border border-border bg-surface-2 text-label text-text-muted"
          >
            {iniciales}
          </button>
        </div>
      </header>

      <main className="space-y-6 px-4 py-6 pb-24">
        <p className="text-body text-text-muted">
          Andamiaje de la fase 0. Esta pantalla es provisional: sirve para
          validar los tokens de <code className="text-accent">design.md</code>{" "}
          en el dispositivo antes de construir el shell.
        </p>

        {/* ---- Sesion ---- */}
        <section className="rounded-card border border-border bg-surface p-4">
          <h2 className="text-title mb-1">Sesion</h2>
          <p className="text-caption mb-3 text-text-muted">
            Si ves tu email aqui, el punto 5 funciona.
          </p>
          <p className="text-body mb-4 break-all text-accent">{email}</p>
          <Button variant="secondary" onClick={() => void supabase.auth.signOut()}>
            Cerrar sesion
          </Button>
        </section>

        {/* ---- Color ---- */}
        <section className="rounded-card border border-border bg-surface p-4">
          <h2 className="text-title mb-3">Color</h2>
          <ul className="space-y-2">
            {COLORES.map(([token, hex, uso]) => (
              <li key={token} className="flex items-center gap-3">
                <span
                  className="size-10 shrink-0 rounded-button border border-border"
                  style={{ backgroundColor: `var(${token})` }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-label">{token}</span>
                  <span className="block text-caption text-text-muted">{uso}</span>
                </span>
                <span className="text-caption tabular-nums text-text-faint">{hex}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ---- Tipografia ---- */}
        <section className="rounded-card border border-border bg-surface p-4">
          <h2 className="text-title mb-3">Tipografia</h2>
          <ul className="space-y-4">
            {TIPOGRAFIA.map(([clase, medidas, muestra]) => (
              <li key={clase}>
                <span className="block text-caption text-text-muted">
                  {clase} · {medidas}
                </span>
                <span className={`${clase} tabular-nums`}>{muestra}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ---- Zonas tactiles (design.md §5) ---- */}
        <section className="rounded-card border border-border bg-surface p-4">
          <h2 className="text-title mb-1">Zonas tactiles</h2>
          <p className="text-caption mb-3 text-text-muted">
            Comprobar con el pulgar, no con el raton.
          </p>

          <div className="mb-3 flex items-center gap-2">
            <button
              type="button"
              className="size-touch-stepper rounded-button bg-surface-2 text-title-lg active:bg-border"
            >
              −
            </button>
            <span className="text-display tabular-nums flex-1 text-center">12</span>
            <button
              type="button"
              className="size-touch-stepper rounded-button bg-surface-2 text-title-lg active:bg-border"
            >
              +
            </button>
          </div>
          <p className="text-caption mb-4 text-text-muted">
            Stepper 64 × 64 — el control mas importante de la app.
          </p>

          <Button>Boton primario · 56 px</Button>
        </section>
      </main>

      {/* Regla de area segura: confirma que env(safe-area-inset-bottom)
          se aplica al instalar en iPhone. No es la TabBar todavia. */}
      <div className="pb-safe fixed inset-x-0 bottom-0 border-t border-border bg-surface">
        <p className="text-caption grid h-tabbar place-items-center text-text-faint">
          area reservada a la barra inferior · 56 px + area segura
        </p>
      </div>
    </div>
  );
}
