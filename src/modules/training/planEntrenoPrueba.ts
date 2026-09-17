import { db } from "@/core/db";
import type { Tables } from "@/core/supabase/types";
import type { ObjetivoPlan } from "./useSesionEntreno";

/**
 * Plan de dos ejercicios con datos de prueba, SOLO para prototipar y probar
 * en el gimnasio la pantalla del modo entreno (spec §4.7) antes de que exista
 * el importador de Excel (§4.6). Se borra en cuanto ese importador exista.
 *
 * Usa ejercicios REALES del catalogo ya sincronizado: exercise_id tiene que
 * apuntar a una fila que exista de verdad, o la subida la rechazaria RLS al
 * no encontrar la clave ajena.
 */

const OBJETIVOS_PRUEBA: readonly ObjetivoPlan[] = [
  { target_sets: 2, target_reps_min: 15, target_reps_max: 15, target_weight: 15, target_rir: 2, rest_seconds: 90 },
  { target_sets: 3, target_reps_min: 8, target_reps_max: 10, target_weight: 40, target_rir: 2, rest_seconds: 120 },
];

const NOMBRES_PREFERIDOS = ["sentadilla", "banca"];

function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export interface ItemPlanPrueba {
  exercise: Tables<"exercises">;
  planned: ObjetivoPlan;
}

export async function construirPlanPrueba(): Promise<ItemPlanPrueba[]> {
  const catalogo = await db.exercises.filter((e) => e.deleted_at == null).sortBy("name");
  if (catalogo.length === 0) return [];

  const elegidos: Tables<"exercises">[] = [];
  for (const nombre of NOMBRES_PREFERIDOS) {
    const encontrado = catalogo.find(
      (e) => normalizar(e.name).includes(nombre) && !elegidos.some((el) => el.id === e.id),
    );
    if (encontrado) elegidos.push(encontrado);
  }
  for (const ejercicio of catalogo) {
    if (elegidos.length >= 2) break;
    if (!elegidos.some((el) => el.id === ejercicio.id)) elegidos.push(ejercicio);
  }

  return elegidos.slice(0, 2).map((exercise, i) => ({
    exercise,
    planned: i === 0 ? OBJETIVOS_PRUEBA[0]! : OBJETIVOS_PRUEBA[1]!,
  }));
}
