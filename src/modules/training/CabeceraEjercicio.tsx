import { MaterialIcon } from "@/core/ui/MaterialIcon";
import { Pill } from "@/core/ui/Pill";
import type { Tables } from "@/core/supabase/types";
import { objetivoSesion } from "./formato";
import type { ObjetivoPautado } from "./formato";

interface CabeceraEjercicioProps {
  ejercicio: Tables<"exercises"> | undefined;
  /** Posicion del ejercicio dentro del dia, 1-indexada: "ejercicio 3 de 5". */
  indice: number;
  total: number;
  objetivo: ObjetivoPautado;
  /** e1RM de la serie que se esta escribiendo ahora, o null si no aplica. */
  e1rmEnVivo: number | null;
  onVerHistorial: () => void;
  onVerVideo: () => void;
}

/**
 * Cabecera del ejercicio en el modo entreno: donde estas dentro del dia,
 * que te toca hacer y por donde ibas.
 *
 * El objetivo sale tal cual del Excel importado (series, reps y RIR
 * pautados). El e1RM es la unica lectura derivada de la pantalla y ya
 * existia desde D28.
 */
export function CabeceraEjercicio({
  ejercicio,
  indice,
  total,
  objetivo,
  e1rmEnVivo,
  onVerHistorial,
  onVerVideo,
}: CabeceraEjercicioProps) {
  return (
    <section className="rounded-card border border-border bg-surface p-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Pill color="accent">{`Ejercicio ${indice} de ${total}`}</Pill>
          {ejercicio?.muscle_group && (
            <span className="text-label-md truncate uppercase tracking-wide text-text-muted">
              {ejercicio.muscle_group}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {ejercicio?.video_url && (
            <button
              type="button"
              onClick={onVerVideo}
              aria-label="Ver vídeo del ejercicio"
              className="size-touch grid place-items-center rounded-chip bg-surface-2 text-text-muted active:bg-surface-3"
            >
              <MaterialIcon nombre="play_circle" tamano={22} />
            </button>
          )}
          <button
            type="button"
            onClick={onVerHistorial}
            aria-label="Ver el historial del ejercicio"
            className="size-touch grid place-items-center rounded-chip bg-surface-2 text-text-muted active:bg-surface-3"
          >
            <MaterialIcon nombre="history" tamano={22} />
          </button>
        </div>
      </div>

      <h1 className="text-title-lg mb-3">{ejercicio?.name ?? "Cargando..."}</h1>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-card bg-surface-2 p-3">
          <p className="text-label-md mb-0.5 uppercase tracking-wide text-text-muted">Objetivo sesión</p>
          <p className="text-body font-semibold tabular-nums text-text">{objetivoSesion(objetivo)}</p>
        </div>
        <div className="rounded-card bg-surface-2 p-3">
          <p className="text-label-md mb-0.5 uppercase tracking-wide text-text-muted">e1RM estimado</p>
          <p className="font-mono text-metric-md tabular-nums text-accent-2">
            {e1rmEnVivo != null ? `${e1rmEnVivo.toFixed(1)} kg` : "—"}
            {e1rmEnVivo != null && (
              <span className="text-caption ml-1 font-sans text-text-muted">(Epley)</span>
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
