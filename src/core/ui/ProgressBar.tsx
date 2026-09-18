export type ColorProgressBar = "accent" | "accent-2" | "danger" | "neutral";

interface ProgressBarProps {
  porcentaje: number;
  color?: ColorProgressBar;
  alto?: "sm" | "md" | "lg";
  className?: string;
}

const COLORES: Record<ColorProgressBar, string> = {
  accent: "bg-accent",
  "accent-2": "bg-accent-2",
  danger: "bg-danger",
  neutral: "bg-text-faint",
};

const ALTOS: Record<NonNullable<ProgressBarProps["alto"]>, string> = {
  sm: "h-1.5",
  md: "h-2",
  lg: "h-3",
};

export function ProgressBar({ porcentaje, color = "accent", alto = "md", className = "" }: ProgressBarProps) {
  const ancho = Math.max(0, Math.min(100, porcentaje));
  return (
    <div className={`w-full overflow-hidden rounded-chip bg-surface-2 ${ALTOS[alto]} ${className}`}>
      <div
        className={`h-full rounded-chip transition-all duration-500 ${COLORES[color]}`}
        style={{ width: `${ancho}%` }}
      />
    </div>
  );
}