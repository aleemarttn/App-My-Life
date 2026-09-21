import { MaterialIcon } from "@/core/ui/MaterialIcon";
import { Pill } from "@/core/ui/Pill";
import type { Tables } from "@/core/supabase/types";
import { textoReps } from "./formato";
import type { ObjetivoPautado } from "./formato";

/** Lo que se ve de una serie ya registrada: lo que se guardo, sin agregar nada. */
function textoRegistrada(log: Tables<"set_logs">): string {
  const partes: string[] = [];
  if (log.weight != null) partes.push(`${log.weight} kg`);
  if (log.reps != null) partes.push(`${log.reps} reps`);
  if (log.duration_seconds != null) partes.push(`${Math.round(log.duration_seconds / 60)} min`);
  if (log.distance_m != null) partes.push(`${log.distance_m / 1000} km`);
  return partes.join(" × ") || "Registrada";
}

/** El objetivo de UNA serie (el de la sesion sin el numero de series). */
function textoPendiente(objetivo: ObjetivoPautado): string {
  const partes: string[] = [];
  if (objetivo.target_weight != null) partes.push(`${objetivo.target_weight} kg`);
  const reps = textoReps(objetivo);
  if (reps != null) partes.push(`${reps} reps`);
  if (objetivo.target_duration_seconds != null) {
    partes.push(`${Math.round(objetivo.target_duration_seconds / 60)} min`);
  }
  if (objetivo.target_distance_m != null) partes.push(`${objetivo.target_distance_m / 1000} km`);
  return partes.join(" × ") || "Sin pauta";
}

interface SecuenciaSeriesProps {
  totalSeries: number;
  objetivo: ObjetivoPautado;
  logs: Tables<"set_logs">[];
  /** Numero de la serie en curso, o null si el ejercicio no es el activo. */
  numeroActual: number | null;
}

/**
 * Lista de SOLO LECTURA del estado de cada serie del ejercicio (D28,
 * ampliada por D31 con RPE y estado por fila).
 *
 * No sustituye al principio de spec §4.7 -- "una serie visible, un paso
 * cada vez": aqui no se registra nada, solo se mira. Vive en dos sitios:
 * debajo de los controles del modo entreno y en la portada de Entreno
 * cuando hay una sesion en curso.
 */
export function SecuenciaSeries({ totalSeries, objetivo, logs, numeroActual }: SecuenciaSeriesProps) {
  const calentamientos = logs.filter((log) => log.is_warmup);
  const efectivas = logs.filter((log) => !log.is_warmup);
  const numeros = Array.from({ length: totalSeries }, (_, i) => i + 1);

  return (
    <ul className="divide-y divide-border">
      {calentamientos.map((log, indice) => (
        <li key={log.id} className="flex items-center gap-3 py-2.5">
          <span className="text-label-md w-7 shrink-0 font-mono tabular-nums text-accent-3">C{indice + 1}</span>
          <div className="min-w-0 flex-1">
            <p className="text-body text-text">Calentamiento</p>
            <p className="text-caption truncate text-text-muted">{textoRegistrada(log)}</p>
          </div>
        </li>
      ))}
      {numeros.map((numero) => {
        const log = efectivas[numero - 1];
        const esActual = numero === numeroActual;

        return (
          <li key={numero} className="flex items-center gap-3 py-2.5">
            <span
              className={
                "text-label-md w-7 shrink-0 font-mono tabular-nums " +
                (esActual ? "text-accent" : log ? "text-text-muted" : "text-text-faint")
              }
            >
              #{numero}
            </span>

            <div className="min-w-0 flex-1">
              {log ? (
                <>
                  <p className="text-body truncate tabular-nums text-text">{textoRegistrada(log)}</p>
                  <p className="text-caption truncate text-text-muted">
                    {log.rir != null ? `RIR ${log.rir}` : "Sin RIR"}
                    {log.rpe != null ? ` · RPE ${log.rpe}` : ""}
                    {log.is_warmup ? " · Calentamiento" : ""}
                  </p>
                </>
              ) : (
                <>
                  <p
                    className={
                      "text-body truncate tabular-nums " + (esActual ? "text-text" : "text-text-faint")
                    }
                  >
                    {textoPendiente(objetivo)}
                  </p>
                  <p className="text-caption truncate text-text-muted">
                    {esActual ? "En curso..." : "Pendiente"}
                    {numero === totalSeries ? " · Serie final" : ""}
                  </p>
                </>
              )}
            </div>

            <span className="shrink-0">
              {log ? (
                <span className="grid size-7 place-items-center rounded-chip bg-surface-2 text-accent">
                  <MaterialIcon nombre="check" tamano={16} />
                </span>
              ) : esActual ? (
                <Pill color="accent-3">Actual</Pill>
              ) : (
                <span className="grid size-7 place-items-center text-text-faint">
                  <MaterialIcon nombre="lock" tamano={14} />
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
