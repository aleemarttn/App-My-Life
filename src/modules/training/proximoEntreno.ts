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

export type EstadoDia = "hecho" | "proximo" | "pendiente";

export interface DiaProgramado {
  dia: Tables<"routine_days">;
  ejercicios: EjercicioPlanificado[];
  estado: EstadoDia;
}

export interface SemanaEntreno {
  rutina: Tables<"routines">;
  weekNumber: number;
  dias: DiaProgramado[];
}

interface ContextoRutina {
  rutina: Tables<"routines">;
  /** Todos los dias del mesociclo, en orden de recorrido. */
  dias: Tables<"routine_days">[];
  /** Cuantos de esos dias ya tienen una sesion terminada. */
  hechas: number;
}

/**
 * Carga compartida por `calcularProximoEntreno` y `calcularSemanaActual`:
 * la rutina activa, sus dias en orden y cuantos ya se completaron. Evita
 * repetir las mismas consultas a Dexie en cada uno.
 */
async function cargarContexto(userId: string): Promise<ContextoRutina | null> {
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

  return { rutina, dias, hechas };
}

async function ejerciciosDelDia(diaId: string): Promise<EjercicioPlanificado[]> {
  const routineExercises = (
    await db.routine_exercises.where("routine_day_id").equals(diaId).toArray()
  ).sort((a, b) => a.position - b.position);

  return Promise.all(
    routineExercises.map(async (re) => ({
      routineExercise: re,
      exercise: await db.exercises.get(re.exercise_id),
    })),
  );
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
  const ctx = await cargarContexto(userId);
  if (!ctx) return null;

  const terminado = ctx.hechas >= ctx.dias.length;
  const indice = terminado ? ctx.dias.length - 1 : ctx.hechas;
  const dia = ctx.dias[indice];
  if (!dia) return null;

  const ejercicios = await ejerciciosDelDia(dia.id);

  return { rutina: ctx.rutina, dia, ejercicios, indice, total: ctx.dias.length, terminado };
}

/**
 * La semana del mesociclo en la que estas ahora mismo (misma `week_number`
 * que el dia que toca), con el estado de cada dia. Es el "calendario" de la
 * portada de Entreno: no son fechas del calendario real (D23 — el mesociclo
 * progresa por secuencia, no por dia de la semana), sino la semana logica
 * de la rutina y lo que queda por hacer en ella.
 */
export async function calcularSemanaActual(userId: string): Promise<SemanaEntreno | null> {
  const ctx = await cargarContexto(userId);
  if (!ctx) return null;

  const terminado = ctx.hechas >= ctx.dias.length;
  const indiceActual = terminado ? ctx.dias.length - 1 : ctx.hechas;
  const diaActual = ctx.dias[indiceActual];
  if (!diaActual) return null;

  const diasSemana = ctx.dias.filter((d) => d.week_number === diaActual.week_number);

  const dias = await Promise.all(
    diasSemana.map(async (dia) => {
      const indiceGlobal = ctx.dias.indexOf(dia);
      const estado: EstadoDia =
        indiceGlobal < indiceActual ? "hecho" : indiceGlobal === indiceActual ? "proximo" : "pendiente";
      return { dia, ejercicios: await ejerciciosDelDia(dia.id), estado };
    }),
  );

  return { rutina: ctx.rutina, weekNumber: diaActual.week_number, dias };
}
