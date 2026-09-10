import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/core/db";

export interface ContadoresOutbox {
  /** Registros escritos que aún no han llegado al servidor. */
  pendientes: number;
  /** Registros que el servidor rechazó y están aparcados. */
  falladas: number;
}

/**
 * Contadores de la cola de subida, leídos EN VIVO de Dexie.
 *
 * Es la única fuente. Antes venían de una copia guardada en el motor de
 * sincronización que solo se refrescaba al terminar un ciclo, y eso daba un
 * fallo desconcertante: creabas un registro en modo avión, se encolaba
 * correctamente, pero el contador seguía a cero durante un minuto y parecía
 * que el dato se había perdido. Justo lo contrario de lo que la outbox debe
 * transmitir.
 *
 * `outbox` es una tabla de Dexie, así que useLiveQuery la observa y vuelve a
 * contar en cuanto cambia. No hay nada que avisar ni que sincronizar.
 */
export function useOutbox(): ContadoresOutbox {
  const pendientes = useLiveQuery(
    () => db.outbox.where("estado").equals("pending").count(),
    [],
    0,
  );
  const falladas = useLiveQuery(
    () => db.outbox.where("estado").equals("failed").count(),
    [],
    0,
  );

  return { pendientes, falladas };
}
