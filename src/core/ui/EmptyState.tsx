import type { ReactNode } from "react";

interface EmptyStateProps {
  /** Icono o emoji. Decorativo: el mensaje tiene que bastar sin el. */
  icono?: ReactNode;
  titulo: string;
  /** Que puede hacer el usuario ahora. No "no hay datos" a secas. */
  descripcion?: string;
  accion?: ReactNode;
}

/**
 * Estado vacio (design.md §8).
 *
 * Se define ANTES de necesitarlo, que es literalmente lo que pide el sistema
 * de diseño: el vacio es el primer estado que ve el usuario y el ultimo que
 * se suele diseñar, y de ahi sale la mayor parte del retrabajo.
 */
export function EmptyState({ icono, titulo, descripcion, accion }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      {icono && <div className="mb-3 text-text-faint">{icono}</div>}
      <p className="text-title">{titulo}</p>
      {descripcion && <p className="text-body mt-1 max-w-xs text-text-muted">{descripcion}</p>}
      {accion && <div className="mt-6 w-full max-w-xs">{accion}</div>}
    </div>
  );
}
