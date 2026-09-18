import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const BASE =
  "inline-flex items-center justify-center rounded-button font-semibold " +
  "transition-all active:scale-[0.98] select-none " +
  "disabled:opacity-50 disabled:pointer-events-none";

const VARIANTES: Record<ButtonVariant, string> = {
  primary:
    "h-touch-primary w-full font-mono text-label uppercase tracking-wide bg-accent text-on-accent active:bg-accent-press",
  secondary: "h-touch px-5 text-body bg-surface-2 text-text active:bg-border",
  ghost: "h-touch px-4 text-body bg-transparent text-text-muted active:bg-surface-2",
  danger: "h-touch px-4 text-body bg-transparent text-danger active:bg-surface-2",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  type = "button",
  className = "",
  children,
  ...resto
}: ButtonProps) {
  return (
    <button type={type} className={`${BASE} ${VARIANTES[variant]} ${className}`} {...resto}>
      {children}
    </button>
  );
}