export type ColorPill = "accent" | "accent-2" | "accent-3" | "danger" | "neutral";

interface PillProps {
  children: string;
  color?: ColorPill;
}

const COLORES: Record<ColorPill, string> = {
  accent: "bg-surface-2 text-accent",
  "accent-2": "bg-surface-2 text-accent-2",
  "accent-3": "bg-surface-2 text-accent-3",
  danger: "bg-danger/10 text-danger",
  neutral: "bg-surface-2 text-text-muted",
};

export function Pill({ children, color = "neutral" }: PillProps) {
  return (
    <span
      className={`text-label-md inline-flex h-5 items-center rounded-chip px-2 font-semibold uppercase tracking-wide ${COLORES[color]}`}
    >
      {children}
    </span>
  );
}