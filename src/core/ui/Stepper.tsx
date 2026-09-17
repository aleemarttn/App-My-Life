interface StepperProps {
  etiqueta: string;
  valor: number;
  onCambiar: (valor: number) => void;
  incremento?: number;
  min?: number;
  max?: number;
  sufijo?: string;
}

/** Evita el clasico 0.1 + 0.2 al acumular incrementos decimales (kg de 2.5 en 2.5). */
function redondear(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Steppers del modo entreno (design.md §5 y §6): el control mas importante
 * de la app. Objetivos de 64x64 px, sin teclado del sistema, para registrar
 * una serie de un vistazo y con una mano (spec §4.7).
 */
export function Stepper({ etiqueta, valor, onCambiar, incremento = 1, min = 0, max, sufijo }: StepperProps) {
  const bajar = () => onCambiar(Math.max(min, redondear(valor - incremento)));
  const subir = () => onCambiar(redondear(Math.min(max ?? Infinity, valor + incremento)));

  return (
    <div>
      <p className="text-label mb-2 text-text-muted">{etiqueta}</p>
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={bajar}
          aria-label={`Restar ${etiqueta}`}
          className="size-touch-stepper shrink-0 rounded-button bg-surface-2 text-title-lg text-text active:bg-border"
        >
          −
        </button>
        <div className="h-touch-stepper flex flex-1 items-center justify-center rounded-button border border-border bg-surface">
          <span className="text-title-lg tabular-nums">
            {valor}
            {sufijo ? ` ${sufijo}` : ""}
          </span>
        </div>
        <button
          type="button"
          onClick={subir}
          aria-label={`Sumar ${etiqueta}`}
          className="size-touch-stepper shrink-0 rounded-button bg-surface-2 text-title-lg text-text active:bg-border"
        >
          +
        </button>
      </div>
    </div>
  );
}
