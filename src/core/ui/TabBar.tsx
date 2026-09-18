import { NavLink } from "react-router";
import type { ReactNode } from "react";

export interface DestinoTab {
  to: string;
  label: string;
  icono: ReactNode;
}

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