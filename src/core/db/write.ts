import { db } from "./schema";
import type { EntradaOutbox, TablaConBorradoLogico, TablaSubible } from "./schema";
import { uuidv7 } from "./uuid";
import type { TablesInsert, TablesUpdate } from "@/core/supabase/types";

/**
 * Unica puerta de escritura de la aplicacion.
 *
 * Regla innegociable (CLAUDE.md): la interfaz NUNCA escribe en Supabase.
 * Todo pasa por aqui, que guarda en Dexie y encola en `outbox` DENTRO DE LA
 * MISMA TRANSACCION. Esa atomicidad es el corazon del asunto: si se
 * guardara primero el dato y luego la cola, un cierre de la app entre
 * ambas operaciones dejaria un registro local que no se subiria jamas.
 */

/**
 * `user_id` de la sesion. Lo fija la capa de sesion al entrar y salir.
 * Se guarda aqui para que ninguna pantalla tenga que acordarse de poner
 * el user_id a mano: olvidarlo significa que RLS rechaza la fila al subir,
 * y el error aparece minutos despues, lejos de donde se causo.
 */
let usuarioActual: string | null = null;

export function fijarUsuarioActual(id: string | null): void {
  usuarioActual = id;
}

export function usuarioActualId(): string | null {
  return usuarioActual;
}

function exigirUsuario(): string {
  if (!usuarioActual) {
    throw new Error("No hay sesion: fijarUsuarioActual() no se ha llamado todavia.");
  }
  return usuarioActual;
}

/** Campos que pone el motor, no quien llama. */
type CamposAutomaticos = "id" | "user_id" | "created_at" | "updated_at";

export type DatosNuevos<T extends TablaSubible> = Omit<TablesInsert<T>, CamposAutomaticos> & {
  /** Solo para reimportar algo con id conocido. Normalmente se omite. */
  id?: string;
};

/**
 * profiles es la excepcion del modelo: su clave primaria ES el id del
 * usuario, no tiene columna user_id. Estamparsela produciria una columna
 * inexistente y un error al subir.
 */
function llevaUserId(tabla: TablaSubible): boolean {
  return tabla !== "profiles";
}

function encolar(
  tabla: TablaSubible,
  id: string,
  op: EntradaOutbox["op"],
  payload: Record<string, unknown>,
  ahora: string,
): Omit<EntradaOutbox, "seq"> {
  return {
    id,
    tabla,
    op,
    payload,
    intentos: 0,
    estado: "pending",
    ultimo_error: null,
    creado_en: ahora,
    proximo_intento_en: ahora,
  };
}

/** Crea una fila nueva. Devuelve el id generado. */
export async function crear<T extends TablaSubible>(
  tabla: T,
  datos: DatosNuevos<T>,
): Promise<string> {
  const ahora = new Date().toISOString();
  const entrada = datos as Record<string, unknown>;
  const id = typeof entrada["id"] === "string" ? entrada["id"] : uuidv7();

  const fila: Record<string, unknown> = {
    ...entrada,
    id,
    created_at: ahora,
    updated_at: ahora,
  };
  if (llevaUserId(tabla)) fila["user_id"] = exigirUsuario();

  await db.transaction("rw", db.table(tabla), db.outbox, async () => {
    await db.table<Record<string, unknown>, string>(tabla).put(fila);
    await db.outbox.add(encolar(tabla, id, "upsert", fila, ahora));
  });

  return id;
}

/**
 * Modifica una fila existente. Lee, fusiona y guarda dentro de la misma
 * transaccion para que dos escrituras simultaneas no se pisen.
 *
 * Sube la fila COMPLETA, no solo el cambio: el servidor resuelve conflictos
 * por `updated_at` (last-write-wins, spec §2.3), y para eso necesita el
 * estado final entero, no un parche.
 */
export async function actualizar<T extends TablaSubible>(
  tabla: T,
  id: string,
  cambios: Partial<Omit<TablesUpdate<T>, CamposAutomaticos>>,
): Promise<void> {
  await aplicarCambios(tabla, id, cambios as Record<string, unknown>);
}

/** Version sin genericos, compartida por actualizar y borrarLogico. */
async function aplicarCambios(
  tabla: TablaSubible,
  id: string,
  cambios: Record<string, unknown>,
): Promise<void> {
  const ahora = new Date().toISOString();

  await db.transaction("rw", db.table(tabla), db.outbox, async () => {
    const tablaDexie = db.table<Record<string, unknown>, string>(tabla);
    const actual = await tablaDexie.get(id);
    if (!actual) throw new Error(`No existe ${tabla}/${id} en la base local.`);

    const fila: Record<string, unknown> = {
      ...actual,
      ...cambios,
      id,
      updated_at: ahora,
    };

    await tablaDexie.put(fila);
    await db.outbox.add(encolar(tabla, id, "upsert", fila, ahora));
  });
}

/**
 * Borrado logico: marca `deleted_at` y conserva la fila.
 *
 * Es el borrado por defecto en las tablas que tienen esa columna. Un
 * borrado real no se puede propagar de forma fiable entre dispositivos
 * sin lapidas, y ademas impide deshacer.
 */
export async function borrarLogico(tabla: TablaConBorradoLogico, id: string): Promise<void> {
  await aplicarCambios(tabla, id, { deleted_at: new Date().toISOString() });
}

/**
 * Borrado real. Solo para tablas sin `deleted_at` (los hijos de una rutina,
 * que desaparecen en cascada) o para deshacer algo recien creado.
 */
export async function borrar<T extends TablaSubible>(tabla: T, id: string): Promise<void> {
  const ahora = new Date().toISOString();

  await db.transaction("rw", db.table(tabla), db.outbox, async () => {
    await db.table<Record<string, unknown>, string>(tabla).delete(id);
    await db.outbox.add(encolar(tabla, id, "delete", { id }, ahora));
  });
}
