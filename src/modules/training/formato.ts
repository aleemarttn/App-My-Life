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
