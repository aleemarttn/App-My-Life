/**
 * Calculo de metricas de progreso por ejercicio (spec §4.9, §2.8). Todo en
 * cliente, sobre datos ya bajados a Dexie: una vista de Postgres seria
 * inalcanzable sin cobertura, y las graficas tienen que funcionar en el
 * gimnasio (spec §2.8, "consecuencia tecnica importante").
 *
 * Modulo sin dependencias de UI a proposito: se prueba con filas
 * inventadas, igual que los parsers del importador.
 */

/** Una serie de trabajo ya registrada (se excluyen los calentamientos). */
export interface SetTrabajo {
  peso: number | null;
  reps: number | null;
  rir: number | null;
  duracion: number | null;
  distancia: number | null;
  tags: string[];
}

/** Todo lo que se hizo de un ejercicio en una sesion, para una fecha. */
export interface RegistroSesion {
  sessionId: string;
  /** ISO. `started_at` de la sesion. */
  fecha: string;
  sets: SetTrabajo[];
  /** Alguna serie llevaba la etiqueta `molestia` (spec §4.9, punto rojo). */
  molestia: boolean;
  /** El ejercicio de esta sesion vino de una sustitucion (punto hueco). */
  sustituido: boolean;
  /** `session_exercises.skipped`: no se hizo, no que falten datos todavia. */
  skipped: boolean;
}

export type MetricaId = "e1rm" | "peso_max" | "tonelaje" | "rir_medio" | "reps_totales" | "duracion" | "distancia";

export interface DefinicionMetrica {
  id: MetricaId;
  etiqueta: string;
  unidad: string;
  pregunta: string;
}

/** spec §4.9: exactamente las cinco metricas de fuerza, en el orden de la tabla. */
export const METRICAS_STRENGTH: DefinicionMetrica[] = [
  { id: "e1rm", etiqueta: "e1RM estimado", unidad: "kg", pregunta: "¿Estoy más fuerte que hace tiempo?" },
  { id: "peso_max", etiqueta: "Peso máximo", unidad: "kg", pregunta: "¿Cuánto muevo hoy en mi mejor serie?" },
  { id: "tonelaje", etiqueta: "Tonelaje", unidad: "kg", pregunta: "¿Cuánto trabajo total estoy haciendo?" },
  { id: "rir_medio", etiqueta: "RIR medio", unidad: "", pregunta: "¿Me estoy exigiendo más o menos?" },
  { id: "reps_totales", etiqueta: "Reps totales", unidad: "", pregunta: "Útil cuando el peso apenas se mueve" },
];

const METRICAS_CARDIO: DefinicionMetrica[] = [
  { id: "distancia", etiqueta: "Distancia", unidad: "km", pregunta: "¿Cuánto recorro?" },
  { id: "duracion", etiqueta: "Duración", unidad: "min", pregunta: "¿Cuánto tiempo aguanto?" },
];

const METRICAS_TIME: DefinicionMetrica[] = [
  { id: "duracion", etiqueta: "Duración", unidad: "min", pregunta: "¿Cuánto tiempo aguanto?" },
];

const METRICAS_DISTANCE: DefinicionMetrica[] = [
  { id: "distancia", etiqueta: "Distancia", unidad: "km", pregunta: "¿Cuánto recorro?" },
];

/** `exercises.kind` -> que metricas tienen sentido para el (spec §4.2). */
export function metricasDe(kind: string): DefinicionMetrica[] {
  switch (kind) {
    case "cardio":
      return METRICAS_CARDIO;
    case "time":
      return METRICAS_TIME;
    case "distance":
      return METRICAS_DISTANCE;
    default:
      return METRICAS_STRENGTH;
  }
}

/** Formula de Epley (spec §4.9): estimacion, no medicion. */
export function e1rm(peso: number, reps: number): number {
  return peso * (1 + reps / 30);
}

function valorSet(metrica: MetricaId, set: SetTrabajo): number | null {
  switch (metrica) {
    case "e1rm":
      return set.peso != null && set.reps != null && set.reps > 0 ? e1rm(set.peso, set.reps) : null;
    case "peso_max":
      return set.peso;
    case "tonelaje":
      return set.peso != null && set.reps != null ? set.peso * set.reps : null;
    case "rir_medio":
      return set.rir;
    case "reps_totales":
      return set.reps;
    case "duracion":
      return set.duracion != null ? set.duracion / 60 : null;
    case "distancia":
      return set.distancia != null ? set.distancia / 1000 : null;
  }
}

/** Como se combinan los sets de una sesion en un solo punto, segun la metrica. */
function agregarSesion(metrica: MetricaId, sets: SetTrabajo[]): number | null {
  const valores = sets.map((s) => valorSet(metrica, s)).filter((v): v is number => v != null);
  if (valores.length === 0) return null;

  switch (metrica) {
    case "tonelaje":
    case "reps_totales":
      return valores.reduce((a, b) => a + b, 0);
    case "rir_medio":
      return valores.reduce((a, b) => a + b, 0) / valores.length;
    case "e1rm":
    case "peso_max":
    case "duracion":
    case "distancia":
      return Math.max(...valores);
  }
}

export interface PuntoSesion {
  sessionId: string;
  fecha: string;
  valor: number;
  molestia: boolean;
  sustituido: boolean;
}

/** Una sesion sin datos para esta metrica (p.ej. RIR sin pautar) no genera punto. */
export function serieDeMetrica(metrica: MetricaId, registros: RegistroSesion[]): PuntoSesion[] {
  const puntos: PuntoSesion[] = [];
  for (const r of registros) {
    const valor = agregarSesion(metrica, r.sets);
    if (valor != null) puntos.push({ sessionId: r.sessionId, fecha: r.fecha, valor, molestia: r.molestia, sustituido: r.sustituido });
  }
  return puntos;
}

export type RangoTiempo = "30d" | "90d" | "1a" | "todo";

export const RANGOS: { id: RangoTiempo; etiqueta: string }[] = [
  { id: "30d", etiqueta: "30 d" },
  { id: "90d", etiqueta: "90 d" },
  { id: "1a", etiqueta: "1 a" },
  { id: "todo", etiqueta: "⌂" },
];

function limiteDeRango(rango: RangoTiempo, ahora: Date): Date | null {
  if (rango === "todo") return null;
  const dias = rango === "30d" ? 30 : rango === "90d" ? 90 : 365;
  const limite = new Date(ahora);
  limite.setDate(limite.getDate() - dias);
  return limite;
}

export function filtrarPorRango(puntos: PuntoSesion[], rango: RangoTiempo, ahora = new Date()): PuntoSesion[] {
  const limite = limiteDeRango(rango, ahora);
  if (!limite) return puntos;
  const desde = limite.toISOString();
  return puntos.filter((p) => p.fecha >= desde);
}

export interface Delta {
  valor: number;
  positivo: boolean;
}

/** Diferencia entre el primer y el ultimo punto visibles. Null con menos de dos. */
export function calcularDelta(puntos: PuntoSesion[]): Delta | null {
  if (puntos.length < 2) return null;
  const valor = puntos.at(-1)!.valor - puntos[0]!.valor;
  return { valor, positivo: valor >= 0 };
}
