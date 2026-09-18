import type { CSSProperties } from "react";

interface MaterialIconProps {
  nombre: string;
  relleno?: 0 | 1;
  tamano?: number;
  className?: string;
}

// Envoltorio del set de iconos Material Symbols Outlined (D28), cargado
// como fuente variable en index.html. Sustituye los SVG dibujados a mano
// de icons.tsx en las pantallas que ya se restylearon a Kinetic Obsidian.
export function MaterialIcon({ nombre, relleno = 0, tamano = 24, className = "" }: MaterialIconProps) {
  const estilo: CSSProperties = {
    fontSize: tamano,
    fontVariationSettings: `"FILL" ${relleno}, "wght" 500, "GRAD" 0, "opsz" 24`,
  };
  return (
    <span aria-hidden className={`material-symbols-outlined leading-none ${className}`} style={estilo}>
      {nombre}
    </span>
  );
}