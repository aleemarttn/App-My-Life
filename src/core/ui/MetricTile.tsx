import type { ReactNode } from "react";
import { ProgressBar } from "./ProgressBar";
import type { ColorProgressBar } from "./ProgressBar";

interface MetricTileProps {
  etiqueta: string;
  valor: string | number;
  unidad?: string;
  icono?: ReactNode;
  caption?: string;
  progreso?: number;
  colorProgreso?: ColorProgressBar;
  className?: string;
}

export function MetricTile({
  etiqueta,
  valor,
  unidad,
  icono,
  caption,
  progreso,
  colorProgreso = "accent",
  className = "",
}: MetricTileProps) {
  return (
    <div className={`flex flex-col justify-between rounded-card border border-border bg-surface p-3 ${className}`}>
      <div className="mb-1 flex items-center justify-between text-text-muted">
        <span className="text-label-md truncate uppercase text-text-muted">{etiqueta}</span>
        {icono && <span className="shrink-0 text-accent">{icono}</span>}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-metric-md tabular-nums text-text">{valor}</span>
        {unidad && <span className="text-label-md text-text-muted">{unidad}</span>}
      </div>
      {caption && <p className="text-caption mt-0.5 truncate text-text-muted">{caption}</p>}
      {progreso != null && <ProgressBar porcentaje={progreso} color={colorProgreso} alto="sm" className="mt-2" />}
    </div>
  );
}