import type { ReactNode } from "react";

interface CardProps {
  /** Titulo opcional. Si se omite, la tarjeta es solo un contenedor. */
  titulo?: string;
  /** Enlace o accion a la derecha del titulo. */
  accion?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * Contenedor base de superficie (design.md §4 y §6).
 *
 * Radio 12, padding 16, y elevacion POR COLOR: en tema oscuro las sombras no
 * se ven, asi que se sube de --bg a --surface y se marca el borde a 1 px.
 */
export function Card({ titulo, accion, className = "", children }: CardProps) {
  return (
    <section className={`rounded-card border border-border bg-surface p-4 ${className}`}>
      {(titulo || accion) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {titulo && <h2 className="text-title truncate">{titulo}</h2>}
          {accion}
        </div>
      )}
      {children}
    </section>
  );
}
