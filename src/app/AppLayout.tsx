import { Link, Outlet, useLocation } from "react-router";
import { AppShell } from "@/core/ui/AppShell";
import { SyncBadge } from "@/core/ui/SyncBadge";
import { DESTINOS, tituloDe } from "./navegacion";
import { useAuth } from "./auth/useAuth";

/**
 * Conecta el AppShell (que es tonto a proposito) con la ruta actual y la
 * sesion. Todo lo que sabe de la aplicacion vive aqui; el shell solo pinta.
 */
export function AppLayout() {
  const { pathname } = useLocation();
  const { session } = useAuth();

  const email = session?.user.email ?? "";
  const iniciales = email.slice(0, 2).toUpperCase() || "··";

  return (
    <AppShell
      titulo={tituloDe(pathname)}
      destinos={DESTINOS}
      insigniaCabecera={<SyncBadge />}
      accionCabecera={
        <Link
          to="/perfil"
          aria-label="Perfil"
          className="size-touch grid place-items-center rounded-chip border border-border bg-surface-2 text-label text-text-muted"
        >
          {iniciales}
        </Link>
      }
    >
      <Outlet />
    </AppShell>
  );
}
