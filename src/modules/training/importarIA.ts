import { supabase } from "@/core/supabase/client";
import type { HojaCruda } from "@/core/xlsx";

/**
 * Capa LLM del importador (spec §4.6, aparcada el 18/09/2026, construida el
 * 23/09/2026): traduce un Excel en formato libre al formato canonico
 * llamando a la Edge Function `translate-routine`.
 *
 * Devuelve filas crudas -- el mismo tipo que produce `leerPrimeraHoja` --
 * para que `ImportarRutinaScreen` las pase directo a `validarFilas()`. Esta
 * funcion NO valida nada: si la IA se equivoca, el validador ya probado lo
 * señala fila a fila, igual que con un Excel canonico mal rellenado.
 *
 * Excepcion al patron "la UI nunca escribe en Supabase" de CLAUDE.md: esto
 * no es una escritura de datos, es una llamada a una Edge Function de
 * traduccion, igual de legitima que cualquier llamada a `parse-entry`.
 */
export async function traducirConIA(hojas: HojaCruda[]): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase.functions.invoke<{ filas?: Record<string, unknown>[] }>(
    "translate-routine",
    { body: { hojas } },
  );

  if (error) {
    const mensaje = await extraerMensaje(error);
    throw new Error(mensaje);
  }
  if (!data?.filas) throw new Error("La IA no devolvió ninguna fila.");

  return data.filas;
}

/** El cliente de Supabase envuelve el cuerpo del error en `context`. */
async function extraerMensaje(error: unknown): Promise<string> {
  const contexto = (error as { context?: Response }).context;
  if (contexto instanceof Response) {
    try {
      const cuerpo = await contexto.clone().json();
      if (typeof cuerpo?.error === "string") return cuerpo.error;
    } catch {
      // cuerpo no era JSON: cae al mensaje generico de abajo
    }
  }
  return error instanceof Error ? error.message : "No se pudo traducir el archivo con IA.";
}
