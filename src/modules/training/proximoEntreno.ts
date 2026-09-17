import { db } from "@/core/db";
import type { Tables } from "@/core/supabase/types";

export interface EjercicioPlanificado {
  routineExercise: Tables<"routine_exercises">;
  exercise: Tables<"exercises"> | undefined;
}

export interface ProximoEntreno {
  rutina: Tables<"routines">;
  dia: Tables<"routine_days">;
  ejercicios: EjercicioPlanificado[];
  /** Posicion del dia dentro del mesociclo, para "día 3 de 16". */
  indice: number;
  total: number;
  /** El mesociclo esta terminado y se esta repitiendo el ultimo dia. */
  terminado: boolean;
}

/**
 * Cual toca hoy.
 *
 * Regla deliberadamente simple: el mesociclo se recorre en orden, y cada
 * sesion terminada avanza un dia. No se ata a la fecha del calendario
 * porque saltarse un lunes no debe desplazar el bloque entero: lo que
 * importa es por donde vas, no en que dia de la semana estas.
 */
export async function calcularProximoEntreno(userId: string): Promise<ProximoEntreno | null> {
  const activas = await db.routines
    .filter((r) => r.user_id === userId && r.active && r.deleted_at == null)
    .toArray();
  const rutina = activas.at(-1);
  if (!rutina) return null;

  const dias = (await db.routine_days.where("routine_id").equals(rutina.id).toArray()).sort(
    (a, b) => a.week_number - b.week_number || a.position - b.position,
  );
  if (dias.length === 0) return null;

  const idsDias = new Set(dias.map((d) => d.id));
  const hechas = await db.workout_sessions
    .filter(
      (s) =>
        s.ended_at != null &&
        s.deleted_at == null &&
        s.routine_day_id != null &&
        idsDias.has(s.routine_day_id),
    )
    .count();

  const terminado = hechas >= dias.length;
  const indice = terminado ? dias.length - 1 : hechas;
  const dia = dias[indice];
  if (!dia) return null;

  const routineExercises = (
    await db.routine_exercises.where("routine_day_id").equals(dia.id).toArray()
  ).sort((a, b) => a.position - b.position);

  const ejercicios = await Promise.all(
    routineExercises.map(async (re) => ({
      routineExercise: re,
      exercise: await db.exercises.get(re.exercise_id),
    })),
  );

  return { rutina, dia, ejercicios, indice, total: dias.length, terminado };
}
