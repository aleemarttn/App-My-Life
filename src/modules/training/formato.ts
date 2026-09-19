/** El objetivo pautado de un `routine_exercise`, en una linea corta. */
export function objetivoCorto(re: {
  target_sets: number | null;
  target_reps_min: number | null;
  target_reps_max: number | null;
  target_weight: number | null;
  target_duration_seconds: number | null;
  target_distance_m: number | null;
}): string {
  const partes: string[] = [];
  if (re.target_sets != null) partes.push(`${re.target_sets}×`);

  const min = re.target_reps_min;
  const max = re.target_reps_max;
  if (min != null || max != null) {
    partes.push(min != null && max != null && min !== max ? `${min}-${max}` : `${max ?? min}`);
  }
  if (re.target_weight != null) partes.push(`· ${re.target_weight} kg`);
  if (re.target_duration_seconds != null) partes.push(`· ${Math.round(re.target_duration_seconds / 60)} min`);
  if (re.target_distance_m != null) partes.push(`· ${re.target_distance_m / 1000} km`);

  return partes.join(" ");
}

/** Lo pautado para un ejercicio, tal y como vino del Excel. Sin calcular nada. */
export interface ObjetivoPautado {
  target_sets: number | null;
  target_reps_min: number | null;
  target_reps_max: number | null;
  target_weight: number | null;
  target_rir: number | null;
  target_duration_seconds: number | null;
  target_distance_m: number | null;
}

/** El rango de reps pautado: "6-8", "8", o null si el Excel no lo traia. */
export function textoReps(o: ObjetivoPautado): string | null {
  const min = o.target_reps_min;
  const max = o.target_reps_max;
  if (min == null && max == null) return null;
  return min != null && max != null && min !== max ? `${min}-${max}` : `${max ?? min}`;
}

/**
 * El objetivo de la sesion en la forma del mockup: "4 × 6-8 @ RPE 8".
 *
 * El RPE que se ensena es la cara visible del `rir` pautado (D30, la misma
 * tabla 1 a 1 que usa el selector): no es una metrica calculada, es la
 * columna `rir` del Excel leida en la escala que se usa en la pantalla.
 */
export function objetivoSesion(o: ObjetivoPautado): string {
  const partes: string[] = [];

  const series = o.target_sets;
  const reps = textoReps(o);
  if (series != null && reps != null) partes.push(`${series} × ${reps}`);
  else if (series != null) partes.push(`${series} series`);
  else if (reps != null) partes.push(`${reps} reps`);

  if (o.target_weight != null) partes.push(`${o.target_weight} kg`);

  if (o.target_duration_seconds != null) {
    const s = o.target_duration_seconds;
    partes.push(s >= 60 ? `${Math.round(s / 60)} min` : `${s} s`);
  }
  if (o.target_distance_m != null) {
    const m = o.target_distance_m;
    partes.push(m >= 1000 ? `${m / 1000} km` : `${m} m`);
  }

  const base = partes.join(" · ");
  if (base === "") return "Sin objetivo pautado";
  return o.target_rir != null ? `${base} @ RPE ${10 - o.target_rir}` : base;
}

/** mm:ss de un cronometro o de un descanso. */
export function reloj(segundos: number): string {
  const s = Math.max(0, Math.floor(segundos));
  const mm = Math.floor(s / 60).toString().padStart(2, "0");
  const ss = (s % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}
