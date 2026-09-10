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
  // Mancuerna: discos como rectangulos macizos en vez de lineas sueltas.
  // A 24 px cuatro trazos verticales se leian como un simbolo raro.
  return (
    <Base {...props}>
      <rect x="2.2" y="8.4" width="3.6" height="7.2" rx="1.2" />
      <rect x="18.2" y="8.4" width="3.6" height="7.2" rx="1.2" />
      <path d="M5.8 12h12.4" />
      <path d="M8.6 9.6v4.8M15.4 9.6v4.8" />
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
  // El techo tiene que verse como techo y las ruedas como ruedas. La version
  // anterior era una caja redondeada con dos rayitas debajo y parecia una
  // impresora: el cuerpo era demasiado alto y las ruedas no eran circulos.
  return (
    <Base {...props}>
      <path d="m4.8 11.4 1.7-4a2 2 0 0 1 1.84-1.2h7.32a2 2 0 0 1 1.84 1.2l1.7 4" />
      <path d="M3.4 11.4h17.2v3.3a.8.8 0 0 1-.8.8H4.2a.8.8 0 0 1-.8-.8Z" />
      <circle cx="7.4" cy="16.9" r="1.55" />
      <circle cx="16.6" cy="16.9" r="1.55" />
    </Base>
  );
}
