import type { ReactNode } from "react";

interface SectionHeaderProps {
  titulo: string;
  icono?: ReactNode;
  meta?: ReactNode;
  className?: string;
}

export function SectionHeader({ titulo, icono, meta, className = "" }: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      <div className="flex min-w-0 items-center gap-2">
        {icono && <span className="shrink-0 text-accent">{icono}</span>}
        <h2 className="text-title truncate">{titulo}</h2>
      </div>
      {meta && <div className="shrink-0">{meta}</div>}
    </div>
  );
}