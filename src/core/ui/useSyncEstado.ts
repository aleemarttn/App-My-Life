import { useSyncExternalStore } from "react";
import { escucharSync, estadoSync } from "@/core/db";
import type { EstadoSync } from "@/core/db";

/**
 * Estado del motor de sincronizacion, para pintarlo.
 *
 * useSyncExternalStore es exactamente la herramienta para esto: el motor
 * vive fuera de React (tiene que seguir funcionando con la app en segundo
 * plano) y esto se limita a leerlo.
 */
export function useSyncEstado(): EstadoSync {
  return useSyncExternalStore(escucharSync, estadoSync, estadoSync);
}
