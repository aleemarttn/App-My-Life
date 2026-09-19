import { db } from "@/core/db";
import { escribirLibro } from "@/core/xlsx";
import type { ObjetivoPlan } from "./useSesionEntreno";

/**
 * Exportador a Excel (spec §4.6): la mitad de vuelta del intercambio con el
 * entrenador. El importador ya lee su plantilla; esto genera el registro
 * de lo entrenado, en el formato acordado — una hoja por semana del
 * mesociclo, mas un resumen por ejercicio.
 *
 * Los calentamientos (`set_logs.is_warmup`) quedan fuera, igual que en
 * `metricas.ts`: no son "series de trabajo" y no aportan a lo que el
 * entrenador quiere ver (tonelaje, RIR, cumplimiento).
 */

/** Un set ya registrado, listo para convertirse en fila. */
export interface SetParaExportar {
  setIndex: number;
  peso: number | null;
  reps: number | null;
  rir: number | null;
  /** Esfuerzo percibido, distinto del RIR (D34). Puede no haberse marcado. */
  rpe: number | null;
  tags: string[];
  nota: string | null;
}

/** Un `session_exercise` con sus sets, la unidad que agrupa el resumen. */
export interface EjercicioParaExportar {
  ejercicioNombre: string;
  sustituidoDeNombre: string | null;
  motivoSustitucion: string | null;
  planned: ObjetivoPlan;
  sets: SetParaExportar[];
}

/** Una sesion completa, ya resuelta contra el catalogo y la rutina. */
export interface SesionParaExportar {
  fecha: string;
  dia: string;
  weekNumber: number;
  ejercicios: EjercicioParaExportar[];
}

export interface FilaSemana {
  fecha: string;
  dia: string;
  ejercicio: string;
  sustituido_de: string;
  motivo_sustitucion: string;
  serie: number;
  peso_pautado: number | string;
  peso_real: number | string;
  reps_pautadas: number | string;
  reps_reales: number | string;
  rir: number | string;
  rpe: number | string;
  etiquetas: string;
  nota: string;
}

export interface FilaResumen {
  ejercicio: string;
  series_totales: number;
  tonelaje_kg: number;
  rir_medio: number | string;
  etiquetas_acumuladas: string;
  sustituciones: number;
  cumplimiento_pct: number;
}

/** El objetivo pautado de repeticiones, en un solo valor (spec §4.6). */
function repsPautadas(planned: ObjetivoPlan): number | string {
  const { target_reps_min: min, target_reps_max: max } = planned;
  if (min == null && max == null) return "";
  return min != null && max != null && min !== max ? `${min}-${max}` : (max ?? min)!;
}

/** Filas para las hojas semanales: una por serie de trabajo registrada. */
export function construirFilasSemana(sesiones: SesionParaExportar[]): FilaSemana[] {
  const filas: FilaSemana[] = [];

  for (const sesion of sesiones) {
    for (const ej of sesion.ejercicios) {
      for (const set of ej.sets) {
        filas.push({
          fecha: sesion.fecha.slice(0, 10),
          dia: sesion.dia,
          ejercicio: ej.ejercicioNombre,
          sustituido_de: ej.sustituidoDeNombre ?? "",
          motivo_sustitucion: ej.motivoSustitucion ?? "",
          serie: set.setIndex,
          peso_pautado: ej.planned.target_weight ?? "",
          peso_real: set.peso ?? "",
          reps_pautadas: repsPautadas(ej.planned),
          reps_reales: set.reps ?? "",
          rir: set.rir ?? "",
          rpe: set.rpe ?? "",
          etiquetas: set.tags.join(", "),
          nota: set.nota ?? "",
        });
      }
    }
  }

  return filas;
}

/** Agrupa las sesiones por semana del mesociclo, en orden. */
export function agruparPorSemana(sesiones: SesionParaExportar[]): Map<number, SesionParaExportar[]> {
  const grupos = new Map<number, SesionParaExportar[]>();
  for (const sesion of sesiones) {
    const lista = grupos.get(sesion.weekNumber);
    if (lista) lista.push(sesion);
    else grupos.set(sesion.weekNumber, [sesion]);
  }
  return new Map([...grupos.entries()].sort((a, b) => a[0] - b[0]));
}

/**
 * Resumen por ejercicio, sobre TODAS las sesiones exportadas (no por
 * semana): series totales, tonelaje, RIR medio, etiquetas que se repitieron,
 * cuantas veces entro por sustitucion y el cumplimiento — series hechas
 * frente a series pautadas, contando un ejercicio sin `target_sets` (cardio,
 * plancha) como una sola serie pautada, igual que `useSesionEntreno`.
 */
export function calcularResumen(sesiones: SesionParaExportar[]): FilaResumen[] {
  const porEjercicio = new Map<
    string,
    { sets: SetParaExportar[]; setsPautados: number; sustituciones: number; etiquetas: Set<string> }
  >();

  for (const sesion of sesiones) {
    for (const ej of sesion.ejercicios) {
      const entrada = porEjercicio.get(ej.ejercicioNombre) ?? {
        sets: [],
        setsPautados: 0,
        sustituciones: 0,
        etiquetas: new Set<string>(),
      };
      entrada.sets.push(...ej.sets);
      entrada.setsPautados += ej.planned.target_sets && ej.planned.target_sets > 0 ? ej.planned.target_sets : 1;
      if (ej.sustituidoDeNombre) entrada.sustituciones += 1;
      for (const set of ej.sets) for (const tag of set.tags) entrada.etiquetas.add(tag);
      porEjercicio.set(ej.ejercicioNombre, entrada);
    }
  }

  const filas: FilaResumen[] = [];
  for (const [ejercicio, entrada] of porEjercicio) {
    const tonelaje = entrada.sets.reduce((suma, s) => suma + (s.peso != null && s.reps != null ? s.peso * s.reps : 0), 0);
    const rirs = entrada.sets.map((s) => s.rir).filter((r): r is number => r != null);
    const cumplimiento = entrada.setsPautados > 0 ? Math.round((entrada.sets.length / entrada.setsPautados) * 100) : 0;

    filas.push({
      ejercicio,
      series_totales: entrada.sets.length,
      tonelaje_kg: Math.round(tonelaje * 10) / 10,
      rir_medio: rirs.length > 0 ? Math.round((rirs.reduce((a, b) => a + b, 0) / rirs.length) * 10) / 10 : "",
      etiquetas_acumuladas: [...entrada.etiquetas].join(", "),
      sustituciones: entrada.sustituciones,
      cumplimiento_pct: cumplimiento,
    });
  }

  return filas.sort((a, b) => a.ejercicio.localeCompare(b.ejercicio));
}

/** Junta las tres piezas en el libro final (spec §4.6, formato de exportacion). */
export function construirHojas(sesiones: SesionParaExportar[]): { nombre: string; filas: Record<string, unknown>[] }[] {
  const porSemana = agruparPorSemana(sesiones);
  const hojas = [...porSemana.entries()].map(([semana, sesionesSemana]) => ({
    nombre: `Semana ${semana}`,
    filas: construirFilasSemana(sesionesSemana) as unknown as Record<string, unknown>[],
  }));

  hojas.push({ nombre: "Resumen", filas: calcularResumen(sesiones) as unknown as Record<string, unknown>[] });
  return hojas;
}

/** Nombre de archivo: el mesociclo y la fecha, para no pisar exportaciones anteriores. */
export function nombreDeExportacionRutina(nombreRutina: string, ahora: Date = new Date()): string {
  const slug = nombreRutina
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const fecha = ahora.toISOString().slice(0, 10);
  return `${slug || "rutina"}_${fecha}.xlsx`;
}

/**
 * Lee la rutina activa entera desde Dexie y arma las sesiones para exportar.
 * Separado de las funciones puras de arriba a proposito: esas se prueban
 * con datos inventados, esta se prueba contra el gimnasio real.
 */
async function sesionesDeRutina(routineId: string): Promise<SesionParaExportar[]> {
  const dias = await db.routine_days.where("routine_id").equals(routineId).toArray();
  const diaPorId = new Map(dias.map((d) => [d.id, d]));
  if (dias.length === 0) return [];

  const sesiones = (
    await Promise.all(dias.map((d) => db.workout_sessions.where("routine_day_id").equals(d.id).toArray()))
  )
    .flat()
    .filter((s) => s.deleted_at == null && s.ended_at != null)
    .sort((a, b) => a.started_at.localeCompare(b.started_at));

  const resultado: SesionParaExportar[] = [];

  for (const sesion of sesiones) {
    const dia = sesion.routine_day_id ? diaPorId.get(sesion.routine_day_id) : undefined;
    if (!dia) continue;

    const sessionExercises = await db.session_exercises
      .where("session_id")
      .equals(sesion.id)
      .sortBy("position");

    const ejercicios: EjercicioParaExportar[] = [];
    for (const se of sessionExercises) {
      if (se.skipped) continue;

      const logs = await db.set_logs
        .where("session_exercise_id")
        .equals(se.id)
        .filter((l) => !l.is_warmup)
        .sortBy("set_index");
      if (logs.length === 0) continue;

      const [ejercicio, sustituidoDe] = await Promise.all([
        db.exercises.get(se.exercise_id),
        se.substituted_from_exercise_id ? db.exercises.get(se.substituted_from_exercise_id) : undefined,
      ]);

      ejercicios.push({
        ejercicioNombre: ejercicio?.name ?? "(ejercicio borrado)",
        sustituidoDeNombre: sustituidoDe?.name ?? null,
        motivoSustitucion: se.substitution_reason,
        planned: se.planned as unknown as ObjetivoPlan,
        sets: logs.map((l) => ({
          setIndex: l.set_index,
          peso: l.weight,
          reps: l.reps,
          rir: l.rir,
          rpe: l.rpe,
          tags: l.tags,
          nota: l.note,
        })),
      });
    }

    if (ejercicios.length === 0) continue;

    resultado.push({
      fecha: sesion.started_at,
      dia: dia.label,
      weekNumber: dia.week_number,
      ejercicios,
    });
  }

  return resultado;
}

export interface ResumenExportacion {
  nombreArchivo: string;
  semanas: number;
  filas: number;
  blob: Blob;
}

/** Punto de entrada para la UI: rutina activa -> archivo .xlsx listo para descargar. */
export async function exportarRutinaActiva(): Promise<ResumenExportacion | null> {
  const rutina = await db.routines.filter((r) => r.active && r.deleted_at == null).first();
  if (!rutina) return null;

  const sesiones = await sesionesDeRutina(rutina.id);
  if (sesiones.length === 0) return null;

  const hojas = construirHojas(sesiones);
  const blob = await escribirLibro(hojas);

  return {
    nombreArchivo: nombreDeExportacionRutina(rutina.name),
    semanas: agruparPorSemana(sesiones).size,
    filas: sesiones.reduce((suma, s) => suma + s.ejercicios.reduce((n, e) => n + e.sets.length, 0), 0),
    blob,
  };
}
