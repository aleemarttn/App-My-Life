import { Button } from "@/core/ui/Button";
import { Card } from "@/core/ui/Card";

/**
 * Hoja de contraste del sistema de diseño.
 *
 * PROVISIONAL: sirve para verificar en el dispositivo los tokens de
 * docs/design.md §2-§5 contra el lienzo de wireframes. Se borra al cerrar
 * la fase 0. Vive en Perfil → Sistema de diseño.
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
  return (
    <div className="space-y-3">
      <Card titulo="Color">
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
      </Card>

      <Card titulo="Tipografia">
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
      </Card>

      <Card titulo="Zonas tactiles">
        <p className="text-caption mb-3 text-text-muted">
          Comprobar con el pulgar, no con el raton.
        </p>

        <div className="mb-2 flex items-center gap-2">
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
      </Card>
    </div>
  );
}
