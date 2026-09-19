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
 * El objetivo de la sesion: "4 × 6-8 · RIR 2".
 *
 * En RIR y no en RPE (D34): `target_rir` es lo unico que pauta el Excel del
 * entrenador, y traducirlo a RPE obligaba a Alejandro a hacer la cuenta al
 * reves en el gimnasio para comprobar si iba en la pauta.
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
  return o.target_rir != null ? `${base} · RIR ${o.target_rir}` : base;
}

/**
 * El RPE equivalente a un RIR, para ensenarlo como referencia debajo del
 * selector de RIR (D34). NO es el RPE que se guarda: ese lo marca Alejandro
 * a mano y puede no coincidir, que es justo el dato interesante.
 */
export function rpeEquivalente(rir: number): number {
  return Math.max(0, 10 - rir);
}

/** mm:ss de un cronometro o de un descanso. */
export function reloj(segundos: number): string {
  const s = Math.max(0, Math.floor(segundos));
  const mm = Math.floor(s / 60).toString().padStart(2, "0");
  const ss = (s % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}
