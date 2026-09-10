import type { ReactNode } from "react";
import { TabBar } from "./TabBar";
import type { DestinoTab } from "./TabBar";

interface AppShellProps {
  titulo: string;
  /** Avatar de Perfil. Va en la cabecera, no en la barra inferior (D11). */
  accionCabecera?: ReactNode;
  /** Indicador de pendientes de sincronizar. */
  insigniaCabecera?: ReactNode;
  destinos: DestinoTab[];
  children: ReactNode;
}

/**
 * Layout de la aplicacion: cabecera, contenido y barra inferior.
 *
 * La cabecera es para ORIENTARSE, no para actuar (design.md §1.1): lleva el
 * titulo, el estado de sincronizacion y el acceso a Perfil, y nada mas. Toda
 * accion primaria vive en el tercio inferior, dentro del contenido.
 *
 * No sabe nada de rutas ni de sesion a proposito: recibe lo que tiene que
 * pintar. Asi sigue siendo un componente del sistema de diseño y no un trozo
 * de la aplicacion escondido en core/.
 */
export function AppShell({
  titulo,
  accionCabecera,
  insigniaCabecera,
  destinos,
  children,
}: AppShellProps) {
  return (
    <div className="min-h-dvh bg-bg text-text">
      <header className="pt-safe sticky top-0 z-10 border-b border-border bg-bg/90 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4">
          <h1 className="text-title truncate">{titulo}</h1>
          <div className="flex shrink-0 items-center gap-2">
            {insigniaCabecera}
            {accionCabecera}
          </div>
        </div>
      </header>

      {/* El hueco de abajo deja sitio a la barra: sin el, la ultima tarjeta
          queda tapada y no hay forma de llegar a ella. */}
      <main className="px-4 pt-4 pb-[calc(var(--spacing-tabbar)+env(safe-area-inset-bottom)+1.5rem)]">
        {children}
      </main>

      <TabBar destinos={destinos} />
    </div>
  );
}
