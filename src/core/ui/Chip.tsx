import type { ReactNode } from "react";

interface ChipProps {
  activo: boolean;
  onClick: () => void;
  children: ReactNode;
}

/** Chip de seleccion (design.md §6): etiquetas del modo entreno, filtros. */
export function Chip({ activo, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={
        "h-touch rounded-chip px-4 text-label transition-colors " +
        (activo ? "bg-accent text-on-accent" : "bg-surface-2 text-text-muted active:bg-border")
      }
    >
      {children}
    </button>
  );
}
