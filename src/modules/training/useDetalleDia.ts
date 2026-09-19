import { useLiveQuery } from "dexie-react-hooks";
import { db, usuarioActualId } from "@/core/db";
import type { Tables } from "@/core/supabase/types";

export interface EjercicioDelDia {
  routineExercise: Tables<"routine_exercises">;
  exercise: Tables<"exercises"> | undefined;
}

export interface EjercicioRegistrado {
  nombre: string;
  sustituidoDe: string | null;
  motivoSustitucion: string | null;
  skipped: boolean;
  logs: Tables<"set_logs">[];
}

export interface SesionDelDia {
  sesion: Tables<"workout_sessions">;
  ejercicios: EjercicioRegistrado[];
  series: number;
}

export interface DetalleDia {
  dia: Tables<"routine_days">;
  rutina: Tables<"routines"> | undefined;
  /** Lo pautado, tal y como vino del Excel. */
  ejercicios: EjercicioDelDia[];
  /** Lo que se hizo: todas las sesiones de este dia, de la mas reciente a la mas antigua. */
  sesiones: SesionDelDia[];
  /** Hay una sesion abierta de este mismo dia ahora mismo. */
  enCurso: boolean;
}

/**
 * Todo lo que se sabe de un dia de la rutina: lo pautado y lo registrado.
 *
 * De SOLO LECTURA (D35). Sirve tanto para mirar un dia que todavia no has
 * hecho -- que toca hoy o que toca dentro de dos semanas -- como para
 * repasar uno que ya hiciste sin tener que abrir el Excel exportado.
 */
export function useDetalleDia(diaId: string | undefined): DetalleDia | null | undefined {
  const userId = usuarioActualId();

  return useLiveQuery(async (): Promise<DetalleDia | null> => {
    if (!userId || !diaId) return null;

    const dia = await db.routine_days.get(diaId);
    if (!dia) return null;

    const routineExercises = (
      await db.routine_exercises.where("routine_day_id").equals(diaId).toArray()
    ).sort((a, b) => a.position - b.position);

    const ejercicios = await Promise.all(
      routineExercises.map(async (re) => ({
        routineExercise: re,
        exercise: await db.exercises.get(re.exercise_id),
      })),
    );

    const sesionesRow = (
      await db.workout_sessions
        .where("user_id")
        .equals(userId)
        .filter((s) => s.routine_day_id === diaId && s.deleted_at == null)
        .toArray()
    ).sort((a, b) => b.started_at.localeCompare(a.started_at));

    const sesiones: SesionDelDia[] = [];
    for (const sesion of sesionesRow) {
      const ses = await db.session_exercises.where("session_id").equals(sesion.id).sortBy("position");

      const registrados: EjercicioRegistrado[] = [];
      let series = 0;

      for (const se of ses) {
        const logs = await db.set_logs.where("session_exercise_id").equals(se.id).sortBy("set_index");
        series += logs.length;

        const ejercicio = await db.exercises.get(se.exercise_id);
        const original = se.substituted_from_exercise_id
          ? await db.exercises.get(se.substituted_from_exercise_id)
          : undefined;

        registrados.push({
          nombre: ejercicio?.name ?? "Ejercicio",
          sustituidoDe: original?.name ?? null,
          motivoSustitucion: se.substitution_reason,
          skipped: se.skipped,
          logs,
        });
      }

      sesiones.push({ sesion, ejercicios: registrados, series });
    }

    return {
      dia,
      rutina: await db.routines.get(dia.routine_id),
      ejercicios,
      sesiones,
      enCurso: sesionesRow.some((s) => s.ended_at == null),
    };
  }, [userId, diaId]);
}
