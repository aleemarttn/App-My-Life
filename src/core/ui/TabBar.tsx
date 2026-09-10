import { NavLink } from "react-router";
import type { ReactNode } from "react";

export interface DestinoTab {
  to: string;
  label: string;
  icono: ReactNode;
}

/**
 * Barra de navegacion inferior (design.md §5, D7).
 *
 * 56 px de alto MAS el area segura del dispositivo. Sin esa suma, en iPhone
 * las pestañas quedan debajo del indicador de inicio y son inpulsables.
 *
 * Cinco destinos es el maximo: seis rompen la zona tactil comoda en una
 * pantalla de 6 pulgadas, que es justo el motivo por el que Perfil vive en
 * la cabecera y no aqui (D11).
 */
export function TabBar({ destinos }: { destinos: DestinoTab[] }) {
  return (
    <nav
      aria-label="Navegación principal"
      className="pb-safe fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface"
    >
      <ul className="flex">
        {destinos.map((destino) => (
          <li key={destino.to} className="flex-1">
            <NavLink
              to={destino.to}
              end={destino.to === "/"}
              className={({ isActive }) =>
                "h-tabbar flex flex-col items-center justify-center gap-0.5 " +
                (isActive ? "text-accent" : "text-text-faint")
              }
            >
              {({ isActive }) => (
                <>
                  {destino.icono}
                  <span className={"text-caption " + (isActive ? "font-medium" : "")}>
                    {destino.label}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
