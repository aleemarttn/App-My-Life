import { useLiveQuery } from "dexie-react-hooks";
import { db, usuarioActualId } from "@/core/db";

function inicioDeSemana(fecha: Date): Date {
  const d = new Date(fecha);
  const dia = d.getDay();
  d.setDate(d.getDate() + (dia === 0 ? -6 : 1 - dia));
  d.setHours(0, 0, 0, 0);
  return d;
}

export function useEntrenosEstaSemana(): number {
  const userId = usuarioActualId();
  return useLiveQuery(
    async () => {
      if (!userId) return 0;
      const desde = inicioDeSemana(new Date()).toISOString();
      return db.workout_sessions
        .where("user_id")
        .equals(userId)
        .filter((s) => s.started_at >= desde && s.ended_at != null && s.deleted_at == null)
        .count();
    },
    [userId],
    0,
  );
}