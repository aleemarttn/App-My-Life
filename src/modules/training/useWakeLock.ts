import { useEffect } from "react";

/**
 * Pantalla siempre encendida durante la sesion (spec §4.7). Sin esto el
 * telefono se bloquea a mitad de serie y hay que desbloquearlo con una mano
 * sudada, que es justo la friccion que la pantalla intenta evitar.
 *
 * Si el navegador no soporta la API, o el sistema deniega el bloqueo, la
 * pantalla simplemente se apagara como siempre: no es un fallo bloqueante.
 */
export function useWakeLock(activo: boolean): void {
  useEffect(() => {
    if (!activo || !("wakeLock" in navigator)) return;

    let sentinel: WakeLockSentinel | null = null;
    let cancelado = false;

    async function pedir(): Promise<void> {
      try {
        sentinel = await navigator.wakeLock.request("screen");
      } catch {
        // Denegado (pestaña oculta, ahorro de bateria, ...). Se reintenta
        // al volver a estar visible.
      }
    }

    void pedir();

    function alCambiarVisibilidad(): void {
      if (document.visibilityState === "visible" && !sentinel && !cancelado) void pedir();
    }
    document.addEventListener("visibilitychange", alCambiarVisibilidad);

    return () => {
      cancelado = true;
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
      void sentinel?.release();
    };
  }, [activo]);
}
