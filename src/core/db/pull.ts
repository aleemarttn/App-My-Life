import { supabase } from "@/core/supabase/client";
import { db, TABLAS_BAJABLES } from "./schema";
import type { TablaBajable } from "./schema";

/** Filas por peticion. */
const PAGINA = 1000;

/** Antes de la primera bajada no hay cursor: se pide todo. */
const ORIGEN_DE_LOS_TIEMPOS = "1970-01-01T00:00:00Z";

/**
 * Columna por la que avanza el cursor de cada tabla.
 *
 * notifications_log es la excepcion: no tiene `updated_at` porque nunca se
 * modifica, solo se inserta desde el servidor.
 */
const COLUMNA_CURSOR: Record<TablaBajable, string> = {
  profiles: "updated_at",
  reminder_rules: "updated_at",
  exercises: "updated_at",
  routines: "updated_at",
  routine_days: "updated_at",
  routine_exercises: "updated_at",
  workout_sessions: "updated_at",
  session_exercises: "updated_at",
  set_logs: "updated_at",
  notifications_log: "sent_at",
};

async function leerCursor(tabla: TablaBajable): Promise<string> {
  const guardado = await db.meta.get(`cursor:${tabla}`);
  return guardado?.valor ?? ORIGEN_DE_LOS_TIEMPOS;
}

/**
 * Baja de una tabla lo que haya cambiado desde el ultimo cursor.
 *
 * Conflictos: si una fila tiene escrituras locales sin subir, la version
 * del servidor NO la pisa. La local es mas nueva por definicion —todavia
 * no ha llegado alli— y machacarla perderia lo que el usuario acaba de
 * registrar, que es exactamente el fallo que la outbox existe para evitar.
 */
async function bajarTabla(tabla: TablaBajable): Promise<number> {
  const columna = COLUMNA_CURSOR[tabla];
  const desde = await leerCursor(tabla);

  const { data, error } = await supabase
    .from(tabla)
    .select("*")
    .gt(columna, desde)
    .order(columna, { ascending: true })
    .limit(PAGINA);

  if (error) throw new Error(`Bajando ${tabla}: ${error.message}`);

  const filas = (data ?? []) as unknown as Record<string, unknown>[];
  if (filas.length === 0) return 0;

  const conCambiosLocales = new Set(
    (await db.outbox.where("tabla").equals(tabla).toArray()).map((e) => e.id),
  );

  const aplicables = filas.filter((f) => !conCambiosLocales.has(f["id"] as string));
  if (aplicables.length > 0) {
    await db.table<Record<string, unknown>, string>(tabla).bulkPut(aplicables);
  }

  // El cursor avanza con la ULTIMA fila recibida, incluidas las que no se
  // aplicaron: ya se veran cuando su escritura local se suba.
  const ultima = filas[filas.length - 1];
  const marca = ultima?.[columna];
  if (typeof marca === "string") {
    await db.meta.put({ clave: `cursor:${tabla}`, valor: marca });
  }

  return aplicables.length;
}

/**
 * Recorre todas las tablas. El orden es el de TABLAS_BAJABLES, que va de
 * padres a hijos, para que Dexie nunca tenga un hijo huerfano a medias.
 */
export async function bajar(): Promise<number> {
  let total = 0;
  for (const tabla of TABLAS_BAJABLES) {
    total += await bajarTabla(tabla);
  }
  return total;
}

/** Borra los cursores para forzar una bajada completa. */
export async function reiniciarCursores(): Promise<void> {
  await Promise.all(TABLAS_BAJABLES.map((t) => db.meta.delete(`cursor:${t}`)));
}
