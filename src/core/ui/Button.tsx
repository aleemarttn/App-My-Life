import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const BASE =
  "inline-flex items-center justify-center rounded-button font-semibold " +
  "transition-colors select-none " +
  "disabled:opacity-50 disabled:pointer-events-none";

/**
 * Alturas segun docs/design.md §5. El primario mide 56 px y ocupa el ancho
 * completo: es la accion de la pantalla, y vive en la zona del pulgar.
 * El resto respeta el minimo de 48 px de cualquier pulsable.
 */
const VARIANTES: Record<ButtonVariant, string> = {
  primary: "h-touch-primary w-full text-title bg-accent text-on-accent active:bg-accent-press",
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
  // Por defecto "button": dentro de un <form>, el valor implicito del
  // navegador es "submit" y provoca envios accidentales.
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
