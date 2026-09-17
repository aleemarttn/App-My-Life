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
      <p className="text-label mb-2 text-center text-text-muted">{etiqueta}</p>
      {/* Una sola pastilla, no tres cajas sueltas: el borde exterior es el
          unico borde, y las lineas internas solo separan, no encierran. */}
      <div className="mx-auto flex h-touch-stepper max-w-72 items-stretch overflow-hidden rounded-button border border-border">
        <button
          type="button"
          onClick={bajar}
          aria-label={`Restar ${etiqueta}`}
          className="w-touch-stepper shrink-0 bg-surface-2 text-title-lg text-text active:bg-border"
        >
          −
        </button>
        <div className="flex flex-1 items-center justify-center border-x border-border bg-surface">
          <span className="text-title-lg tabular-nums">
            {valor}
            {sufijo ? ` ${sufijo}` : ""}
          </span>
        </div>
        <button
          type="button"
          onClick={subir}
          aria-label={`Sumar ${etiqueta}`}
          className="w-touch-stepper shrink-0 bg-surface-2 text-title-lg text-text active:bg-border"
        >
          +
        </button>
      </div>
    </div>
  );
}
