import { useEffect, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { actualizar, crear, db, usuarioActualId } from "@/core/db";
import type { Json, Tables } from "@/core/supabase/types";
import { construirPlanPrueba } from "./planEntrenoPrueba";

export interface ObjetivoPlan {
  target_sets: number;
  target_reps_min: number;
  target_reps_max: number;
  target_weight: number;
  target_rir: number;
  rest_seconds: number;
}

export interface PasoActual {
  sessionExercise: Tables<"session_exercises">;
  planned: ObjetivoPlan;
  numeroSerie: number;
}

interface DatosSesion {
  sesion: Tables<"workout_sessions"> | undefined;
  ejercicios: Tables<"session_exercises">[];
  logsPorEjercicio: Record<string, Tables<"set_logs">[]>;
}

function calcularPaso(datos: DatosSesion): PasoActual | null {
  for (const se of datos.ejercicios) {
    if (se.skipped) continue;
    const planned = se.planned as unknown as ObjetivoPlan;
    const hechas = datos.logsPorEjercicio[se.id]?.length ?? 0;
    if (hechas < planned.target_sets) {
      return { sessionExercise: se, planned, numeroSerie: hechas + 1 };
    }
  }
  return null;
}

export interface EntradaSerie {
  reps: number;
  peso: number;
  rir: number | null;
  tags: string[];
  nota: string;
}

export interface EstadoSesionEntreno {
  /** Aun no se sabe si hay sesion activa: no pintar nada definitivo todavia. */
  cargando: boolean;
  /** El catalogo de ejercicios todavia no ha llegado del servidor. */
  catalogoVacio: boolean;
  paso: PasoActual | null;
  /** Hay sesion, tiene ejercicios y ninguno queda por hacer. */
  completada: boolean;
  seriesRegistradas: number;
  confirmarSerie: (entrada: EntradaSerie) => Promise<void>;
  saltarEjercicio: () => Promise<void>;
  sustituirEjercicio: (nuevoExerciseId: string, motivo: string) => Promise<void>;
}

/**
 * Orquesta la sesion del modo entreno: la crea si no existe, la retoma si
 * se abandono a medias (spec §4.7 — "la sesion se puede abandonar y
 * retomar: el estado vive en Dexie") y calcula cual es la proxima serie.
 *
 * Una sola consulta reactiva junta sesion + ejercicios + series: Dexie
 * observa las tablas que se leen dentro, así que no hace falta encadenar
 * varios useLiveQuery ni llevar sus dependencias a mano.
 */
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

  const catalogoListo = useLiveQuery(() => db.exercises.count(), [], 0) > 0;
  const cargando = datos === undefined;

  // Crea la sesion de prueba si no hay ninguna en curso. `creandoRef` evita
  // dispararla dos veces en el doble efecto de React 18 en desarrollo.
  useEffect(() => {
    if (cargando || !userId || datos.sesion || creandoRef.current || !catalogoListo) return;

    creandoRef.current = true;
    void (async () => {
      const plan = await construirPlanPrueba();
      if (plan.length === 0) {
        creandoRef.current = false;
        return;
      }

      const sessionId = await crear("workout_sessions", {
        started_at: new Date().toISOString(),
        ended_at: null,
        routine_day_id: null,
        perceived_effort: null,
        notes: "Prototipo del modo entreno con datos de prueba (fase 1, docs/estado.md).",
      });

      for (const [posicion, item] of plan.entries()) {
        await crear("session_exercises", {
          session_id: sessionId,
          routine_exercise_id: null,
          exercise_id: item.exercise.id,
          position: posicion,
          planned: item.planned as unknown as Json,
          skipped: false,
        });
      }
    })();
  }, [cargando, userId, datos, catalogoListo]);

  const paso = cargando ? null : calcularPaso(datos);
  const completada = !cargando && datos.ejercicios.length > 0 && paso === null;

  // Cierra la sesion en cuanto no queda ningun ejercicio pendiente.
  useEffect(() => {
    if (!completada || cargando || !datos.sesion || datos.sesion.ended_at) return;
    void actualizar("workout_sessions", datos.sesion.id, { ended_at: new Date().toISOString() });
  }, [completada, cargando, datos]);

  const seriesRegistradas = cargando
    ? 0
    : Object.values(datos.logsPorEjercicio).reduce((total, logs) => total + logs.length, 0);

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

  return {
    cargando,
    catalogoVacio: !cargando && !datos.sesion && !catalogoListo,
    paso,
    completada,
    seriesRegistradas,
    confirmarSerie,
    saltarEjercicio,
    sustituirEjercicio,
  };
}
