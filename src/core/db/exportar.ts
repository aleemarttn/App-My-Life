import { db, TABLAS_BAJABLES } from "./schema";
import { usuarioActualId } from "./write";

/**
 * Volcado completo de la base local a JSON.
 *
 * `spec.md` §11 lo lista como la mitigacion del riesgo "perdida de datos en
 * sync offline": si algo va mal con la cola o con el servidor, esto es la
 * copia que queda. Por eso incluye TAMBIEN la outbox: lo pendiente de subir
 * es justo lo que no esta a salvo en ningun otro sitio, y omitirlo dejaría
 * fuera de la copia lo único que la copia existe para proteger.
 */

export interface Exportacion {
  version: 1;
  exportado_en: string;
  usuario: string | null;
  tablas: Record<string, unknown[]>;
  outbox: unknown[];
  cursores: Record<string, string>;
}

export async function exportarTodo(): Promise<Exportacion> {
  const tablas: Record<string, unknown[]> = {};
  for (const nombre of TABLAS_BAJABLES) {
    tablas[nombre] = await db.table<Record<string, unknown>, string>(nombre).toArray();
  }

  const cursores: Record<string, string> = {};
  for (const entrada of await db.meta.toArray()) {
    cursores[entrada.clave] = entrada.valor;
  }

  return {
    version: 1,
    exportado_en: new Date().toISOString(),
    usuario: usuarioActualId(),
    tablas,
    outbox: await db.outbox.toArray(),
    cursores,
  };
}

/** Nombre de archivo con la fecha, para que no se pisen dos copias. */
export function nombreDeExportacion(ahora: Date = new Date()): string {
  const iso = ahora.toISOString().slice(0, 19).replace(/[:T]/g, "-");
  return `my-life-${iso}.json`;
}

/**
 * Vacia la base local. NO toca el servidor.
 *
 * Se lleva por delante lo que haya pendiente de subir, asi que la interfaz
 * tiene que pedir confirmacion y ofrecer la exportacion antes.
 */
export async function vaciarBaseLocal(): Promise<void> {
  await Promise.all(db.tables.map((t) => t.clear()));
}
