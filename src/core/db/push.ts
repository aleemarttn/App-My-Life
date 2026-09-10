import { supabase } from "@/core/supabase/client";
import { db } from "./schema";
import type { EntradaOutbox } from "./schema";

/** Reintentos antes de aparcar una entrada como fallida. */
const MAX_INTENTOS = 10;
/** Techo del retroceso exponencial. */
const ESPERA_MAX_MS = 5 * 60 * 1000;
/** Entradas por ciclo, para no bloquear el hilo con una cola larga. */
const LOTE = 200;

export interface ResultadoSubida {
  subidas: number;
  pendientes: number;
  falladas: number;
}

function esperaTras(intentos: number): number {
  return Math.min(1000 * 2 ** intentos, ESPERA_MAX_MS);
}

/**
 * Distingue el fallo que se arregla solo del que no.
 *
 * Es la decision mas importante del motor. Un fallo de red se reintenta
 * eternamente, porque el tunel se acaba. Una violacion de RLS o de una
 * restriccion NO se arregla reintentando: repetirla mil veces solo bloquea
 * la cola detras de ella y esconde el problema real.
 */
function esPermanente(codigo: string | undefined): boolean {
  if (!codigo) return false; // sin codigo suele ser fallo de red: transitorio
  return (
    codigo.startsWith("22") || // datos invalidos (formato, rango)
    codigo.startsWith("23") || // integridad (unica, clave ajena, not null)
    codigo === "42501" || // RLS: la fila no es de este usuario
    codigo.startsWith("PGRST") // peticion mal formada, columna inexistente
  );
}

async function enviar(entrada: EntradaOutbox): Promise<{ ok: boolean; codigo?: string; mensaje?: string }> {
  // El cliente tipado no puede inferir la forma del payload cuando el
  // nombre de la tabla es una union: cada tabla tiene columnas distintas.
  // La forma ya quedo fijada en write.ts, a partir de los tipos generados.
  const tabla = supabase.from(entrada.tabla);

  const { error } =
    entrada.op === "delete"
      ? await tabla.delete().eq("id", entrada.id)
      : await tabla.upsert(entrada.payload as never);

  if (!error) return { ok: true };
  return { ok: false, codigo: error.code, mensaje: error.message };
}

/**
 * Vacia la cola en orden estricto de llegada.
 *
 * El orden importa: una sesion tiene que existir en el servidor antes que
 * sus series, o la clave ajena la rechaza. Por eso un fallo transitorio
 * DETIENE el ciclo entero en lugar de saltar a la siguiente entrada.
 */
export async function empujar(): Promise<ResultadoSubida> {
  let subidas = 0;
  let falladas = 0;

  const ahora = new Date().toISOString();
  const candidatas = await db.outbox
    .orderBy("seq")
    .filter((e) => e.estado === "pending" && e.proximo_intento_en <= ahora)
    .limit(LOTE)
    .toArray();

  for (const entrada of candidatas) {
    const resultado = await enviar(entrada);
    const seq = entrada.seq;
    if (seq === undefined) continue;

    if (resultado.ok) {
      // Solo AQUI se borra: con la confirmacion del servidor en la mano.
      await db.outbox.delete(seq);
      subidas += 1;
      continue;
    }

    const intentos = entrada.intentos + 1;
    const permanente = esPermanente(resultado.codigo);
    const agotada = intentos >= MAX_INTENTOS;

    if (permanente || agotada) {
      // Se aparca, nunca se borra: el dato del usuario no se tira jamas.
      await db.outbox.update(seq, {
        intentos,
        estado: "failed",
        ultimo_error: resultado.mensaje ?? "error desconocido",
      });
      falladas += 1;
      continue;
    }

    await db.outbox.update(seq, {
      intentos,
      ultimo_error: resultado.mensaje ?? "error desconocido",
      proximo_intento_en: new Date(Date.now() + esperaTras(intentos)).toISOString(),
    });
    // Fallo transitorio: se para para no adelantar a nadie en la cola.
    break;
  }

  return { subidas, falladas, pendientes: await contarPendientes() };
}

/** Lo que alimenta al SyncBadge de design.md §6. */
export async function contarPendientes(): Promise<number> {
  return db.outbox.where("estado").equals("pending").count();
}

/** Entradas aparcadas que necesitan intervencion. */
export async function contarFalladas(): Promise<number> {
  return db.outbox.where("estado").equals("failed").count();
}

/** Devuelve las aparcadas a la cola. Para un boton de "reintentar". */
export async function reintentarFalladas(): Promise<number> {
  const ahora = new Date().toISOString();
  return db.outbox.where("estado").equals("failed").modify({
    estado: "pending",
    intentos: 0,
    proximo_intento_en: ahora,
  });
}
