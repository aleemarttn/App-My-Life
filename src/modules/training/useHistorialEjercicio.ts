import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import type { RegistroDetailView } from "@/core/ui/DetailView";
import { db, usuarioActualId } from "@/core/db";
import type { Tables } from "@/core/supabase/types";
import {
  calcularDelta,
  filtrarPorRango,
  metricasDe,
  serieDeMetrica,
  type Delta,
  type MetricaId,
  type PuntoSesion,
  type RangoTiempo,
  type RegistroSesion,
  type SetTrabajo,
} from "./metricas";

const FORMATO_FECHA_CORTA = new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short" });

function duracionLegible(segundos: number): string {
  if (segundos < 60) return `${segundos} s`;
  const min = Math.floor(segundos / 60);
  const seg = segundos % 60;
  return seg === 0 ? `${min} min` : `${min}:${String(seg).padStart(2, "0")} min`;
}

/** La linea de un registro, adaptada al tipo de ejercicio (spec §4.2 y §4.9). */
function formatearRegistro(kind: string, sets: SetTrabajo[]): string {
  if (sets.length === 0) return "Sin series registradas";

  if (kind === "time") {
    const mejor = Math.max(...sets.map((s) => s.duracion ?? 0));
    return duracionLegible(mejor);
  }
  if (kind === "distance") {
    const mejor = Math.max(...sets.map((s) => s.distancia ?? 0));
    return `${(mejor / 1000).toFixed(mejor % 1000 === 0 ? 0 : 2)} km`;
  }
  if (kind === "cardio") {
    const distancia = Math.max(...sets.map((s) => s.distancia ?? 0));
    const duracion = Math.max(...sets.map((s) => s.duracion ?? 0));
    const partes: string[] = [];
    if (distancia > 0) partes.push(`${(distancia / 1000).toFixed(distancia % 1000 === 0 ? 0 : 2)} km`);
    if (duracion > 0) partes.push(duracionLegible(duracion));
    return partes.join(" · ") || "Sin datos";
  }

  // strength y cualquier otro: la mejor serie de trabajo, como en el wireframe.
  const conPeso = sets.filter((s) => s.peso != null);
  const mejor = (conPeso.length > 0 ? conPeso : sets).reduce((a, b) => ((b.peso ?? 0) > (a.peso ?? 0) ? b : a));
  const partes = [`${sets.length}×${mejor.reps ?? "?"}`];
  if (mejor.peso != null) partes.push(`${mejor.peso} kg`);
  if (mejor.rir != null) partes.push(`RIR ${mejor.rir}`);
  return partes.join(" · ");
}

interface DatosHistorial {
  ejercicio: Tables<"exercises">;
  registros: RegistroSesion[];
}

interface HistorialEjercicio {
  cargando: boolean;
  ejercicio: Tables<"exercises"> | undefined;
  metricas: { id: MetricaId; etiqueta: string }[];
  metrica: MetricaId;
  setMetrica: (m: MetricaId) => void;
  rango: RangoTiempo;
  setRango: (r: RangoTiempo) => void;
  puntos: PuntoSesion[];
  valorActual: string | null;
  delta: Delta | null;
  unidad: string;
  empezarEnCero: boolean;
  registrosLista: RegistroDetailView[];
}

/**
 * Reune todo lo que pide el `DetailView` de un ejercicio (spec §2.8, §4.9):
 * la serie temporal segun la metrica elegida, el valor y delta del rango
 * visible, y la lista de registros con la mejor serie de cada sesion.
 *
 * Toda la agregacion ocurre aqui, en cliente sobre Dexie — nunca en una
 * vista de Postgres (spec §2.8): tiene que funcionar sin cobertura.
 */
export function useHistorialEjercicio(exerciseId: string): HistorialEjercicio {
  const userId = usuarioActualId();
  const [rango, setRango] = useState<RangoTiempo>("90d");

  const datos = useLiveQuery(async (): Promise<DatosHistorial | null> => {
    if (!userId) return null;
    const ejercicio = await db.exercises.get(exerciseId);
    if (!ejercicio) return null;

    const sessionExercises = await db.session_exercises
      .where("[user_id+exercise_id]")
      .equals([userId, exerciseId])
      .toArray();
    if (sessionExercises.length === 0) return { ejercicio, registros: [] };

    const sesiones = await db.workout_sessions.bulkGet(sessionExercises.map((se) => se.session_id));
    const sesionPorId = new Map(sesiones.filter((s): s is Tables<"workout_sessions"> => s != null).map((s) => [s.id, s]));

    const idsSessionExercises = sessionExercises.map((se) => se.id);
    const logs = await db.set_logs.where("session_exercise_id").anyOf(idsSessionExercises).toArray();
    const logsPorSessionExercise = new Map<string, Tables<"set_logs">[]>();
    for (const log of logs) {
      if (log.is_warmup) continue;
      const lista = logsPorSessionExercise.get(log.session_exercise_id);
      if (lista) lista.push(log);
      else logsPorSessionExercise.set(log.session_exercise_id, [log]);
    }

    const registros: RegistroSesion[] = [];
    for (const se of sessionExercises) {
      const sesion = sesionPorId.get(se.session_id);
      if (!sesion || sesion.deleted_at != null) continue;

      const logsDeEste = logsPorSessionExercise.get(se.id) ?? [];
      // Sin series y sin marcar como saltado: la sesion sigue en curso y
      // todavia no se ha llegado a este ejercicio. No es historial todavia.
      if (logsDeEste.length === 0 && !se.skipped && sesion.ended_at == null) continue;

      const sets: SetTrabajo[] = logsDeEste.map((l) => ({
        peso: l.weight,
        reps: l.reps,
        rir: l.rir,
        duracion: l.duration_seconds,
        distancia: l.distance_m,
        tags: l.tags,
      }));

      registros.push({
        sessionId: sesion.id,
        fecha: sesion.started_at,
        sets,
        molestia: sets.some((s) => s.tags.includes("molestia")),
        sustituido: se.substituted_from_exercise_id != null,
        skipped: se.skipped,
      });
    }

    registros.sort((a, b) => a.fecha.localeCompare(b.fecha));
    return { ejercicio, registros };
  }, [userId, exerciseId]);

  const metricasDisponibles = metricasDe(datos?.ejercicio.kind ?? "strength");
  const [metrica, setMetricaState] = useState<MetricaId>(metricasDisponibles[0]!.id);
  // Si cambia el ejercicio y la metrica elegida ya no es valida para su tipo, vuelve a la primera.
  const metricaValida = metricasDisponibles.some((m) => m.id === metrica) ? metrica : metricasDisponibles[0]!.id;

  const cargando = datos === undefined;
  const registrosOrdenadosAsc = datos?.registros ?? [];
  const serieCompleta = serieDeMetrica(metricaValida, registrosOrdenadosAsc);
  const puntos = filtrarPorRango(serieCompleta, rango);
  const definicion = metricasDisponibles.find((m) => m.id === metricaValida)!;

  const valorActual = serieCompleta.length > 0 ? serieCompleta.at(-1)!.valor : null;
  const delta = calcularDelta(puntos);

  const empezarEnCero = metricaValida === "tonelaje" || metricaValida === "reps_totales";

  const registrosLista: RegistroDetailView[] = [...registrosOrdenadosAsc]
    .reverse()
    .map((r) => ({
      id: r.sessionId,
      etiqueta: FORMATO_FECHA_CORTA.format(new Date(r.fecha)),
      valor: r.skipped ? "Saltado" : formatearRegistro(datos?.ejercicio.kind ?? "strength", r.sets),
      atenuado: r.skipped || r.sustituido,
    }));

  return {
    cargando,
    ejercicio: datos?.ejercicio,
    metricas: metricasDisponibles,
    metrica: metricaValida,
    setMetrica: setMetricaState,
    rango,
    setRango,
    puntos,
    valorActual: valorActual != null ? valorActual.toFixed(1).replace(/\.0$/, "") : null,
    delta,
    unidad: definicion.unidad,
    empezarEnCero,
    registrosLista,
  };
}
