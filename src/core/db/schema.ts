import Dexie from "dexie";
import type { EntityTable } from "dexie";
import type { Tables } from "@/core/supabase/types";

/**
 * Base de datos local. Es la FUENTE DE VERDAD DE LA INTERFAZ: la app lee
 * siempre de aqui y nunca espera a la red para pintar (spec §2.3).
 *
 * Las tablas replican una a una las de Postgres, con la misma forma, para
 * que subir un registro sea un `upsert` directo sin traducir nada.
 */

/** Tablas que el cliente puede modificar y, por tanto, subir. */
export const TABLAS_SUBIBLES = [
  "profiles",
  "reminder_rules",
  "exercises",
  "routines",
  "routine_days",
  "routine_exercises",
  "workout_sessions",
  "session_exercises",
  "set_logs",
] as const;

export type TablaSubible = (typeof TABLAS_SUBIBLES)[number];

/**
 * Tablas que se bajan del servidor. Incluye notifications_log, que el
 * cliente solo lee: su migracion no tiene politica de insert a proposito,
 * porque ahi solo escribe scheduler-tick con la clave de servicio.
 */
export const TABLAS_BAJABLES = [...TABLAS_SUBIBLES, "notifications_log"] as const;

export type TablaBajable = (typeof TABLAS_BAJABLES)[number];

/**
 * Las unicas tablas con columna `deleted_at`. Los hijos de una rutina o de
 * una sesion no la tienen: desaparecen en cascada con su padre, asi que un
 * borrado logico propio no tendria sentido.
 *
 * Tenerlo como tipo hace que intentar un borrado logico donde no cabe sea
 * un error de compilacion y no una columna inexistente detectada al subir.
 */
export const TABLAS_CON_BORRADO_LOGICO = [
  "reminder_rules",
  "exercises",
  "routines",
  "workout_sessions",
] as const;

export type TablaConBorradoLogico = (typeof TABLAS_CON_BORRADO_LOGICO)[number];

/** Estado de un envio pendiente. */
export type EstadoOutbox = "pending" | "failed";

export interface EntradaOutbox {
  /**
   * Autoincremental LOCAL, no viaja al servidor. Da el orden FIFO estricto
   * que respeta las claves ajenas: una sesion se sube antes que sus series.
   * La regla de "nada de serial" de CLAUDE.md habla de los id de Postgres,
   * que siguen siendo UUID v7 generados en cliente.
   */
  seq?: number;
  /** id de la fila afectada (UUID v7). */
  id: string;
  tabla: TablaSubible;
  op: "upsert" | "delete";
  payload: Record<string, unknown>;
  intentos: number;
  estado: EstadoOutbox;
  ultimo_error: string | null;
  creado_en: string;
  /** ISO. Antes de este instante no se reintenta (retroceso exponencial). */
  proximo_intento_en: string;
}

/** Pares clave-valor para cursores de bajada y demas estado del motor. */
export interface EntradaMeta {
  clave: string;
  valor: string;
}

export class MyLifeDB extends Dexie {
  profiles!: EntityTable<Tables<"profiles">, "id">;
  reminder_rules!: EntityTable<Tables<"reminder_rules">, "id">;
  notifications_log!: EntityTable<Tables<"notifications_log">, "id">;
  exercises!: EntityTable<Tables<"exercises">, "id">;
  routines!: EntityTable<Tables<"routines">, "id">;
  routine_days!: EntityTable<Tables<"routine_days">, "id">;
  routine_exercises!: EntityTable<Tables<"routine_exercises">, "id">;
  workout_sessions!: EntityTable<Tables<"workout_sessions">, "id">;
  session_exercises!: EntityTable<Tables<"session_exercises">, "id">;
  set_logs!: EntityTable<Tables<"set_logs">, "id">;
  outbox!: EntityTable<EntradaOutbox, "seq">;
  meta!: EntityTable<EntradaMeta, "clave">;

  constructor(nombre = "my-life") {
    super(nombre);

    // Solo se indexa lo que se consulta. IndexedDB no indexa booleanos de
    // forma fiable, asi que `active` y `skipped` se filtran en memoria.
    this.version(1).stores({
      profiles: "id",
      reminder_rules: "id, user_id, module, updated_at",
      notifications_log: "id, user_id, sent_at",
      exercises: "id, user_id, name, updated_at",
      routines: "id, user_id, updated_at",
      routine_days: "id, routine_id, [routine_id+week_number], updated_at",
      routine_exercises: "id, routine_day_id, [routine_day_id+position], updated_at",
      workout_sessions: "id, user_id, started_at, updated_at",
      session_exercises:
        "id, session_id, exercise_id, [session_id+position], [user_id+exercise_id], updated_at",
      set_logs: "id, session_exercise_id, [session_exercise_id+set_index], logged_at, updated_at",
      outbox: "++seq, id, tabla, estado, proximo_intento_en",
      meta: "clave",
    });
  }
}

export const db = new MyLifeDB();
