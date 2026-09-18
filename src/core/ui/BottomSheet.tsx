import type { ReactNode } from "react";

interface BottomSheetProps {
  /** Opcional: si se omite, la hoja no lleva cabecera propia. */
  titulo?: string;
  onCerrar: () => void;
  children: ReactNode;
}

/**
 * Hoja inferior generica (design.md §6). Mismo patron que ya usaba
 * `SustituirSheet` a mano para su paso del motivo: fondo atenuado con
 * blur, panel fijo al fondo con radio 16 px (`rounded-t-sheet`) y area
 * segura (`pb-safe`) para no quedar debajo del indicador de inicio.
 *
 * Cerrar tocando el fondo es el gesto esperado en una hoja inferior;
 * `stopPropagation` en el panel evita que un toque dentro la cierre.
 */
export function BottomSheet({ titulo, onCerrar, children }: BottomSheetProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-bg/80 backdrop-blur"
      onClick={onCerrar}
    >
      <div
        className="rounded-t-sheet bg-surface p-4 pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {titulo && (
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-title truncate">{titulo}</h2>
            <button
              type="button"
              onClick={onCerrar}
              aria-label="Cerrar"
              className="size-touch grid shrink-0 place-items-center text-text-muted"
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
