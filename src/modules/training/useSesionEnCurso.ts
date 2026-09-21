import { useLiveQuery } from "dexie-react-hooks";
import { db, usuarioActualId } from "@/core/db";
import type { Tables } from "@/core/supabase/types";
import type { ObjetivoPlan } from "./useSesionEntreno";

export type EstadoEjercicio = "hecho" | "actual" | "pendiente" | "saltado";

export interface EjercicioEnCurso {
  sessionExercise: Tables<"session_exercises">;
  exercise: Tables<"exercises"> | undefined;
  planned: ObjetivoPlan;
  totalSeries: number;
  logs: Tables<"set_logs">[];
  estado: EstadoEjercicio;
}

export interface SesionEnCurso {
  sesion: Tables<"workout_sessions">;
  dia: Tables<"routine_days"> | undefined;
  ejercicios: EjercicioEnCurso[];
  /** Indice en `ejercicios` del que toca ahora, o -1 si no queda ninguno. */
  indiceActual: number;
  seriesRegistradas: number;
  seriesPlanificadas: number;
}

function seriesDe(planned: ObjetivoPlan): number {
  return planned.target_sets && planned.target_sets > 0 ? planned.target_sets : 1;
}

/**
 * Mirador de SOLO LECTURA de la sesion abierta (D31).
 *
 * `useSesionEntreno` crea la sesion y sus `session_exercises` al montarse:
 * por eso la portada de Entreno no puede usarlo: abrir la pestaña dejaria
 * un entreno empezado sin haberle dado a nada. Este hook solo lee lo que
 * ya existe; si no hay sesion abierta devuelve null.
 */
export function useSesionEnCurso(): SesionEnCurso | null | undefined {
  const userId = usuarioActualId();

  return useLiveQuery(async (): Promise<SesionEnCurso | null> => {
    if (!userId) return null;

    const abiertas = await db.workout_sessions
      .where("user_id")
      .equals(userId)
      .filter((s) => s.ended_at == null && s.deleted_at == null)
      .sortBy("started_at");
    const sesion = abiertas.at(-1);
    if (!sesion) return null;

    const sesionExercises = await db.session_exercises
      .where("session_id")
      .equals(sesion.id)
      .sortBy("position");

    const ids = sesionExercises.map((e) => e.id);
    const logs = ids.length > 0 ? await db.set_logs.where("session_exercise_id").anyOf(ids).sortBy("set_index") : [];
    const logsPorEjercicio: Record<string, Tables<"set_logs">[]> = {};
    for (const log of logs) {
      (logsPorEjercicio[log.session_exercise_id] ??= []).push(log);
    }

    // El ejercicio "actual" se decide igual que en el modo entreno: el
    // primero no saltado al que le faltan series. Asi las dos pantallas
    // nunca discrepan sobre por donde vas.
    let indiceActual = -1;
    const ejercicios: EjercicioEnCurso[] = [];

    for (const [indice, se] of sesionExercises.entries()) {
      const planned = se.planned as unknown as ObjetivoPlan;
      const totalSeries = seriesDe(planned);
      const propios = logsPorEjercicio[se.id] ?? [];
      const completo = propios.filter((log) => !log.is_warmup).length >= totalSeries;

      let estado: EstadoEjercicio;
      if (se.skipped) estado = "saltado";
      else if (completo) estado = "hecho";
      else if (indiceActual === -1) {
        estado = "actual";
        indiceActual = indice;
      } else estado = "pendiente";

      ejercicios.push({
        sessionExercise: se,
        exercise: await db.exercises.get(se.exercise_id),
        planned,
        totalSeries,
        logs: propios,
        estado,
      });
    }

    const dia = sesion.routine_day_id ? await db.routine_days.get(sesion.routine_day_id) : undefined;

    return {
      sesion,
      dia,
      ejercicios,
      indiceActual,
      seriesRegistradas: logs.length,
      seriesPlanificadas: ejercicios
        .filter((e) => !e.sessionExercise.skipped)
        .reduce((total, e) => total + e.totalSeries, 0),
    };
  }, [userId]);
}
