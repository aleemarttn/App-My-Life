import { useEffect, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { actualizar, crear, db, usuarioActualId } from "@/core/db";
import type { Json, Tables } from "@/core/supabase/types";
import { calcularProximoEntreno } from "./proximoEntreno";

export interface ObjetivoPlan {
  target_sets: number | null;
  target_reps_min: number | null;
  target_reps_max: number | null;
  target_weight: number | null;
  target_rir: number | null;
  target_duration_seconds: number | null;
  target_distance_m: number | null;
  rest_seconds: number | null;
}

export interface PasoActual {
  sessionExercise: Tables<"session_exercises">;
  planned: ObjetivoPlan;
  numeroSerie: number;
  totalSeries: number;
  /** Posicion del ejercicio dentro del dia, 1-indexada: "ejercicio 3 de 5". */
  indiceEjercicio: number;
  totalEjercicios: number;
  /** El descanso pautado en el Excel, o el de por defecto si no venia. */
  descansoSegundos: number;
}

/** Lo que se descansa cuando el Excel del entrenador no dice nada. */
export const DESCANSO_POR_DEFECTO = 120;

interface DatosSesion {
  sesion: Tables<"workout_sessions"> | undefined;
  ejercicios: Tables<"session_exercises">[];
  logsPorEjercicio: Record<string, Tables<"set_logs">[]>;
}

function seriesDe(planned: ObjetivoPlan): number {
  return planned.target_sets && planned.target_sets > 0 ? planned.target_sets : 1;
}

function calcularPaso(datos: DatosSesion): PasoActual | null {
  for (const [indice, se] of datos.ejercicios.entries()) {
    if (se.skipped) continue;
    const planned = se.planned as unknown as ObjetivoPlan;
    const total = seriesDe(planned);
    const hechas = datos.logsPorEjercicio[se.id]?.length ?? 0;
    if (hechas < total) {
      return {
        sessionExercise: se,
        planned,
        numeroSerie: hechas + 1,
        totalSeries: total,
        indiceEjercicio: indice + 1,
        totalEjercicios: datos.ejercicios.length,
        descansoSegundos: planned.rest_seconds ?? DESCANSO_POR_DEFECTO,
      };
    }
  }
  return null;
}

export interface EntradaSerie {
  reps: number | null;
  peso: number | null;
  rir: number | null;
  tags: string[];
  nota: string;
}

export interface EstadoSesionEntreno {
  cargando: boolean;
  sinRutina: boolean;
  sesion: Tables<"workout_sessions"> | undefined;
  paso: PasoActual | null;
  completada: boolean;
  seriesRegistradas: number;
  logsDelEjercicioActual: Tables<"set_logs">[];
  confirmarSerie: (entrada: EntradaSerie) => Promise<void>;
  saltarEjercicio: () => Promise<void>;
  sustituirEjercicio: (nuevoExerciseId: string, motivo: string) => Promise<void>;
  terminarSesion: () => Promise<void>;
}

export function useSesionEntreno(): EstadoSesionEntreno {
  const userId = usuarioActualId();
  const creandoRef = useRef(false);

  const datos = useLiveQuery(async (): Promise<DatosSesion> => {
    if (!userId) return { sesion: undefined, ejercicios: [], logsPorEjercicio: {} };

    const sesiones = await db.workout_sessions
      .where("user_id")
      .equals(userId)
      .filter((s) => s.ended_at == null && s.deleted_at == null)
      .sortBy("started_at");
    const sesion = sesiones.at(-1);
    if (!sesion) return { sesion: undefined, ejercicios: [], logsPorEjercicio: {} };

    const ejercicios = await db.session_exercises.where("session_id").equals(sesion.id).sortBy("position");

    const ids = ejercicios.map((e) => e.id);
    const logs = ids.length > 0 ? await db.set_logs.where("session_exercise_id").anyOf(ids).sortBy("set_index") : [];
    const logsPorEjercicio: Record<string, Tables<"set_logs">[]> = {};
    for (const log of logs) {
      (logsPorEjercicio[log.session_exercise_id] ??= []).push(log);
    }

    return { sesion, ejercicios, logsPorEjercicio };
  }, [userId]);

  const proximo = useLiveQuery(
    async () => (userId ? await calcularProximoEntreno(userId) : null),
    [userId],
  );

  const cargando = datos === undefined || proximo === undefined;

  useEffect(() => {
    if (cargando || !userId || datos.sesion || creandoRef.current || !proximo) return;

    creandoRef.current = true;
    void (async () => {
      const sessionId = await crear("workout_sessions", {
        started_at: new Date().toISOString(),
        ended_at: null,
        routine_day_id: proximo.dia.id,
        perceived_effort: null,
        notes: null,
      });

      for (const [posicion, item] of proximo.ejercicios.entries()) {
        const re = item.routineExercise;
        const planned: ObjetivoPlan = {
          target_sets: re.target_sets,
          target_reps_min: re.target_reps_min,
          target_reps_max: re.target_reps_max,
          target_weight: re.target_weight,
          target_rir: re.target_rir,
          target_duration_seconds: re.target_duration_seconds,
          target_distance_m: re.target_distance_m,
          rest_seconds: re.rest_seconds,
        };

        await crear("session_exercises", {
          session_id: sessionId,
          routine_exercise_id: re.id,
          exercise_id: re.exercise_id,
          position: posicion,
          planned: planned as unknown as Json,
          skipped: false,
        });
      }
    })();
  }, [cargando, userId, datos, proximo]);

  const paso = cargando ? null : calcularPaso(datos);
  const completada = !cargando && datos.ejercicios.length > 0 && paso === null;

  useEffect(() => {
    if (!completada || cargando || !datos.sesion || datos.sesion.ended_at) return;
    void actualizar("workout_sessions", datos.sesion.id, { ended_at: new Date().toISOString() });
  }, [completada, cargando, datos]);

  const seriesRegistradas = cargando
    ? 0
    : Object.values(datos.logsPorEjercicio).reduce((total, logs) => total + logs.length, 0);

  const logsDelEjercicioActual =
    !cargando && paso ? (datos.logsPorEjercicio[paso.sessionExercise.id] ?? []) : [];

  async function confirmarSerie(entrada: EntradaSerie): Promise<void> {
    if (!paso) return;
    await crear("set_logs", {
      session_exercise_id: paso.sessionExercise.id,
      set_index: paso.numeroSerie,
      is_warmup: false,
      weight: entrada.peso,
      reps: entrada.reps,
      rir: entrada.rir,
      tags: entrada.tags,
      note: entrada.nota.trim() === "" ? null : entrada.nota.trim(),
    });
  }

  async function saltarEjercicio(): Promise<void> {
    if (!paso) return;
    await actualizar("session_exercises", paso.sessionExercise.id, { skipped: true });
  }

  async function sustituirEjercicio(nuevoExerciseId: string, motivo: string): Promise<void> {
    if (!paso) return;
    await actualizar("session_exercises", paso.sessionExercise.id, {
      exercise_id: nuevoExerciseId,
      substituted_from_exercise_id: paso.sessionExercise.exercise_id,
      substitution_reason: motivo.trim() === "" ? null : motivo.trim(),
    });
  }

  async function terminarSesion(): Promise<void> {
    if (cargando || !datos.sesion || datos.sesion.ended_at) return;
    await actualizar("workout_sessions", datos.sesion.id, { ended_at: new Date().toISOString() });
  }

  return {
    cargando,
    sinRutina: !cargando && !datos.sesion && !proximo,
    sesion: cargando ? undefined : datos.sesion,
    paso,
    completada,
    seriesRegistradas,
    logsDelEjercicioActual,
    confirmarSerie,
    saltarEjercicio,
    sustituirEjercicio,
    terminarSesion,
  };
}
