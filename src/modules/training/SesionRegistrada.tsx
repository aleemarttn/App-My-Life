import { Pill } from "@/core/ui/Pill";
import type { Tables } from "@/core/supabase/types";
import type { SesionDelDia } from "./useDetalleDia";

const FECHA = new Intl.DateTimeFormat("es-ES", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

/** Lo que se guardo de una serie, sin recalcular nada. */
function textoSerie(log: Tables<"set_logs">): string {
  const partes: string[] = [];
  if (log.weight != null) partes.push(`${log.weight} kg`);
  if (log.reps != null) partes.push(`${log.reps} reps`);
  if (log.duration_seconds != null) partes.push(`${Math.round(log.duration_seconds / 60)} min`);
  if (log.distance_m != null) partes.push(`${log.distance_m / 1000} km`);
  return partes.join(" × ") || "—";
}

function textoEsfuerzo(log: Tables<"set_logs">): string {
  const partes: string[] = [];
  if (log.rir != null) partes.push(`RIR ${log.rir}`);
  if (log.rpe != null) partes.push(`RPE ${log.rpe}`);
  if (log.tags.length > 0) partes.push(log.tags.join(", "));
  return partes.join(" · ");
}

/**
 * Una sesion ya registrada de un dia, serie a serie. Es la respuesta a
 * "¿que hice yo el otro lunes?" sin abrir el Excel exportado.
 */
export function SesionRegistrada({ sesion }: { sesion: SesionDelDia }) {
  const terminada = sesion.sesion.ended_at != null;

  return (
    <section className="rounded-card border border-border bg-surface p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-label-md uppercase tracking-wide text-text-muted">Lo que hiciste</h2>
          <p className="text-body truncate first-letter:uppercase">
            {FECHA.format(new Date(sesion.sesion.started_at))}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-label font-mono tabular-nums text-text">{sesion.series} series</span>
          <Pill color={terminada ? "accent" : "accent-3"}>{terminada ? "Terminada" : "En curso"}</Pill>
        </div>
      </div>

      <ul className="space-y-3">
        {sesion.ejercicios.map((ejercicio, indice) => (
          <li key={indice}>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <p className="text-body min-w-0 truncate text-text">{ejercicio.nombre}</p>
              {ejercicio.skipped && <span className="text-caption shrink-0 text-text-faint">saltado</span>}
            </div>

            {ejercicio.sustituidoDe && (
              <p className="text-caption mb-1 text-accent-3">
                sustituyó a {ejercicio.sustituidoDe}
                {ejercicio.motivoSustitucion ? ` · ${ejercicio.motivoSustitucion}` : ""}
              </p>
            )}

            {ejercicio.logs.length === 0 ? (
              <p className="text-caption text-text-faint">sin series registradas</p>
            ) : (
              <ul className="divide-y divide-border rounded-button bg-surface-2 px-3">
                {ejercicio.logs.map((log) => (
                  <li key={log.id} className="flex items-baseline gap-3 py-1.5">
                    <span className="text-label-md w-7 shrink-0 font-mono tabular-nums text-text-faint">
                      #{log.set_index}
                    </span>
                    <span className="text-label min-w-0 flex-1 truncate tabular-nums text-text">
                      {textoSerie(log)}
                    </span>
                    <span className="text-caption shrink-0 truncate text-text-muted">
                      {textoEsfuerzo(log)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {ejercicio.logs.some((l) => l.note) && (
              <ul className="mt-1 space-y-0.5">
                {ejercicio.logs
                  .filter((l) => l.note)
                  .map((l) => (
                    <li key={l.id} className="text-caption text-text-muted">
                      #{l.set_index}: {l.note}
                    </li>
                  ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
