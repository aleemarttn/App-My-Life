import type { ReactNode } from "react";

interface CardProps {
  titulo?: string;
  accion?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * Contenedor base de superficie (design.md paragrafo 4 y 6).
 *
 * Radio 8, padding 16, y elevacion POR CAPA TONAL (D28): en tema oscuro las
 * sombras no se ven, asi que se sube de --bg a --surface y se marca el
 * borde a 1 px en vez de difuminar una sombra.
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