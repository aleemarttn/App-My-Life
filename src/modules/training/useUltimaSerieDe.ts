import { useLiveQuery } from "dexie-react-hooks";
import { db, usuarioActualId } from "@/core/db";

export interface UltimaSerie {
  peso: number | null;
  reps: number | null;
}

export function useUltimaSerieDe(exerciseId: string | undefined, sesionActualId: string | undefined): UltimaSerie | null {
  return (
    useLiveQuery(
      async () => {
        const userId = usuarioActualId();
        if (!exerciseId || !userId) return null;

        const sessionExercises = await db.session_exercises
          .where("[user_id+exercise_id]")
          .equals([userId, exerciseId])
          .filter((se) => se.session_id !== sesionActualId)
          .toArray();
        if (sessionExercises.length === 0) return null;

        const idsOrdenados = sessionExercises
          .slice()
          .sort((a, b) => b.created_at.localeCompare(a.created_at))
          .map((se) => se.id);

        for (const id of idsOrdenados) {
          const logs = await db.set_logs
            .where("session_exercise_id")
            .equals(id)
            .filter((l) => !l.is_warmup)
            .sortBy("set_index");
          const ultimo = logs.at(-1);
          if (ultimo) return { peso: ultimo.weight, reps: ultimo.reps };
        }

        return null;
      },
      [exerciseId, sesionActualId],
      null,
    ) ?? null
  );
}