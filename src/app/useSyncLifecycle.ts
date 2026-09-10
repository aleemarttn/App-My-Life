import { useEffect } from "react";
import { detenerSync, fijarUsuarioActual, iniciarSync } from "@/core/db";
import { useAuth } from "./auth/useAuth";

/**
 * Ata el ciclo de vida de core/db al de la sesion.
 *
 * Al entrar: se fija el user_id que estampara toda escritura y arranca el
 * motor. Al salir: se para y se olvida el usuario, para que una escritura
 * posterior falle de forma ruidosa en lugar de guardar una fila sin dueño.
 *
 * No se borra la base local al cerrar sesion, y es deliberado: ahi puede
 * haber registros sin subir. Tirarlos seria justo el fallo que la outbox
 * existe para impedir.
 */
export function useSyncLifecycle(): void {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  useEffect(() => {
    fijarUsuarioActual(userId);

    if (!userId) {
      detenerSync();
      return;
    }

    iniciarSync();
    return () => {
      detenerSync();
    };
  }, [userId]);
}
