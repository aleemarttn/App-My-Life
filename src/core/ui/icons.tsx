import type { SVGProps } from "react";

/**
 * Iconos de la barra inferior, dibujados a mano.
 *
 * Son cinco: traer una libreria de iconos entera (~50 kB) para eso seria
 * desproporcionado, y `CLAUDE.md` pide no meter dependencias de UI pesadas.
 *
 * Excepcion consciente a la regla de "un componente por archivo": un set de
 * iconos es una unidad, y partirlo en cinco archivos de seis lineas solo
 * añadiria ruido.
 */

type Props = SVGProps<SVGSVGElement>;

function Base({ children, ...resto }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-6"
      {...resto}
    >
      {children}
    </svg>
  );
}

export function IconoInicio(props: Props) {
  return (
    <Base {...props}>
      <path d="M3.5 10.2 12 3.5l8.5 6.7" />
      <path d="M5.8 9.4V20h12.4V9.4" />
      <path d="M9.8 20v-5.2h4.4V20" />
    </Base>
  );
}

export function IconoEntreno(props: Props) {
  return (
    <Base {...props}>
      <path d="M4 9.5v5M7 6.5v11M17 6.5v11M20 9.5v5M7 12h10" />
    </Base>
  );
}

export function IconoComida(props: Props) {
  return (
    <Base {...props}>
      <path d="M3.5 11.8h17a8.5 8.5 0 0 1-17 0Z" />
      <path d="M8.6 8.2c-.6-.9-.4-1.9.4-2.7M12.2 8c-.6-1-.3-2.1.5-2.9M15.8 8.2c-.6-.9-.4-1.9.4-2.7" />
    </Base>
  );
}

export function IconoDinero(props: Props) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M15.6 8.9a4.6 4.6 0 0 0-6.5 1.3M9.1 13.8a4.6 4.6 0 0 0 6.5 1.3M7.6 11h5.6M7.6 13.2h5.6" />
    </Base>
  );
}

export function IconoCoche(props: Props) {
  return (
    <Base {...props}>
      <path d="m5 11.5 1.6-4.3a2 2 0 0 1 1.9-1.3h7a2 2 0 0 1 1.9 1.3L19 11.5" />
      <path d="M4.4 11.5h15.2a1.4 1.4 0 0 1 1.4 1.4v2.7a.9.9 0 0 1-.9.9H3.9a.9.9 0 0 1-.9-.9v-2.7a1.4 1.4 0 0 1 1.4-1.4Z" />
      <path d="M7 16.5v1.4M17 16.5v1.4" />
    </Base>
  );
}
