import { MaterialIcon } from "@/core/ui/MaterialIcon";
import { Pill } from "@/core/ui/Pill";
import { reloj, rpeEquivalente, textoReps } from "./formato";
import type { ObjetivoPautado } from "./formato";

const RIR_OPCIONES = [0, 1, 2, 3, 4, 5];
const INCREMENTOS_PESO = [-5, -2.5, 2.5, 5];
const RPE_PASO = 0.5;
const RPE_INICIAL = 8;

function redondear(n: number): number {
  return Math.round(n * 100) / 100;
}

interface ControlesSerieProps {
  numeroSerie: number;
  totalSeries: number;
  objetivo: ObjetivoPautado;
  /** El peso de la ultima vez que se hizo este ejercicio, si lo hubo. */
  pesoReferencia: number | null;
  peso: number;
  onPeso: (valor: number) => void;
  reps: number;
  onReps: (valor: number) => void;
  rir: number | null;
  onRir: (valor: number) => void;
  rpe: number | null;
  onRpe: (valor: number | null) => void;
  isWarmup: boolean;
  onWarmup: (valor: boolean) => void;
  descansoSegundos: number;
  autoDescanso: boolean;
  onAutoDescanso: (valor: boolean) => void;
}

/**
 * Los controles con los que se registra una serie.
 *
 * RIR y RPE son dos campos distintos, no dos nombres del mismo (D34): el
 * RIR es lo que pauta el entrenador y se marca de un toque; el RPE es como
 * se te hizo la serie y es opcional, en pasos de 0,5.
 */
export function ControlesSerie({
  numeroSerie,
  totalSeries,
  objetivo,
  pesoReferencia,
  peso,
  onPeso,
  reps,
  onReps,
  rir,
  onRir,
  rpe,
  onRpe,
  isWarmup,
  onWarmup,
  descansoSegundos,
  autoDescanso,
  onAutoDescanso,
}: ControlesSerieProps) {
  const repsObjetivo = textoReps(objetivo);
  const rirObjetivo = objetivo.target_rir;

  return (
    <section className="rounded-card border border-accent/30 bg-surface p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="size-2 animate-pulse rounded-chip bg-accent" />
          <h2 className="text-title">
            Serie {numeroSerie} de {totalSeries}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => onWarmup(!isWarmup)}
          aria-pressed={isWarmup}
          className="rounded-chip focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <Pill color={isWarmup ? "accent-3" : "accent"}>{isWarmup ? "Calentamiento" : "Efectiva"}</Pill>
        </button>
      </div>

      <div className="mb-4">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <p className="text-label-md uppercase tracking-wide text-text-muted">Carga</p>
          <p className="text-label-md tabular-nums text-accent">
            {objetivo.target_weight != null
              ? `Pautado: ${objetivo.target_weight} kg`
              : pesoReferencia != null
                ? `Última vez: ${pesoReferencia} kg`
                : "Sin pautar · elige tú"}
          </p>
        </div>
        <div className="flex h-touch-stepper items-stretch overflow-hidden rounded-button border border-border">
          {INCREMENTOS_PESO.slice(0, 2).map((inc) => (
            <button
              key={inc}
              type="button"
              onClick={() => onPeso(Math.max(0, redondear(peso + inc)))}
              aria-label={`Restar ${Math.abs(inc)} kg`}
              className="text-label w-14 shrink-0 bg-surface-2 font-mono tabular-nums text-text active:bg-border"
            >
              {inc}
            </button>
          ))}
          <div className="flex flex-1 items-baseline justify-center gap-1 border-x border-border bg-surface-2/40">
            <span className="font-mono text-metric-xl tabular-nums text-text">{peso.toFixed(1)}</span>
            <span className="text-label-md uppercase text-text-muted">kg</span>
          </div>
          {INCREMENTOS_PESO.slice(2).map((inc) => (
            <button
              key={inc}
              type="button"
              onClick={() => onPeso(Math.max(0, redondear(peso + inc)))}
              aria-label={`Sumar ${inc} kg`}
              className="text-label w-14 shrink-0 bg-surface-2 font-mono tabular-nums text-accent active:bg-border"
            >
              +{inc}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <p className="text-label-md uppercase tracking-wide text-text-muted">Repeticiones</p>
          {repsObjetivo && (
            <p className="text-label-md tabular-nums text-accent">Objetivo: {repsObjetivo} reps</p>
          )}
        </div>
        <div className="flex h-touch-stepper items-stretch overflow-hidden rounded-button border border-border">
          <button
            type="button"
            onClick={() => onReps(Math.max(0, reps - 1))}
            aria-label="Restar una repetición"
            className="w-touch-stepper shrink-0 bg-surface-2 text-title-lg text-text active:bg-border"
          >
            −
          </button>
          <div className="flex flex-1 items-baseline justify-center gap-1 border-x border-border bg-surface-2/40">
            <span className="font-mono text-metric-xl tabular-nums text-text">{reps}</span>
            <span className="text-label-md uppercase text-text-muted">reps</span>
          </div>
          <button
            type="button"
            onClick={() => onReps(reps + 1)}
            aria-label="Sumar una repetición"
            className="w-touch-stepper shrink-0 bg-surface-2 text-title-lg text-accent active:bg-border"
          >
            +
          </button>
        </div>
      </div>

      <div className="mb-4">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <p className="text-label-md uppercase tracking-wide text-text-muted">
            RIR <span className="normal-case tracking-normal">· reps que me dejo</span>
          </p>
          {rirObjetivo != null && (
            <p className="text-label-md tabular-nums text-accent">Pautado: RIR {rirObjetivo}</p>
          )}
        </div>
        <div className="flex gap-1.5">
          {RIR_OPCIONES.map((valor) => {
            const activo = rir === valor;
            const esObjetivo = rirObjetivo === valor;
            return (
              <button
                key={valor}
                type="button"
                onClick={() => onRir(valor)}
                aria-pressed={activo}
                aria-label={esObjetivo ? `RIR ${valor}, el pautado` : `RIR ${valor}`}
                className={
                  "text-label h-touch flex-1 rounded-button font-mono tabular-nums " +
                  (activo
                    ? "bg-accent text-on-accent"
                    : esObjetivo
                      ? "border border-accent/60 bg-surface-2 text-accent active:bg-border"
                      : "bg-surface-2 text-text-muted active:bg-border")
                }
              >
                {valor}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-4">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <p className="text-label-md uppercase tracking-wide text-text-muted">
            RPE <span className="normal-case tracking-normal">· cómo se me ha hecho</span>
          </p>
          <p className="text-label-md text-text-faint">Opcional</p>
        </div>
        <div className="flex h-touch items-stretch overflow-hidden rounded-button border border-border">
          <button
            type="button"
            onClick={() => onRpe(rpe == null ? RPE_INICIAL : Math.max(0, redondear(rpe - RPE_PASO)))}
            aria-label="Bajar el RPE"
            className="w-14 shrink-0 bg-surface-2 text-title-lg text-text active:bg-border"
          >
            −
          </button>
          <div className="flex flex-1 items-center justify-center gap-2 border-x border-border bg-surface-2/40">
            <span className="font-mono text-metric-md tabular-nums text-text">
              {rpe != null ? rpe.toFixed(1) : "—"}
            </span>
            {rpe != null && rir != null && rpe !== rpeEquivalente(rir) && (
              <span className="text-caption text-accent-3">≠ RIR {rir}</span>
            )}
            {rpe != null && (
              <button
                type="button"
                onClick={() => onRpe(null)}
                aria-label="Quitar el RPE"
                className="text-caption text-text-faint underline"
              >
                quitar
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => onRpe(rpe == null ? RPE_INICIAL : Math.min(10, redondear(rpe + RPE_PASO)))}
            aria-label="Subir el RPE"
            className="w-14 shrink-0 bg-surface-2 text-title-lg text-accent active:bg-border"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-button bg-surface-2 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <MaterialIcon nombre="schedule" tamano={18} className="shrink-0 text-accent-2" />
          <div className="min-w-0">
            <p className="text-label-md uppercase tracking-wide text-text-muted">Descanso sugerido</p>
            <p className="font-mono text-metric-md tabular-nums text-text">{reloj(descansoSegundos)} min</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onAutoDescanso(!autoDescanso)}
          aria-pressed={autoDescanso}
          className="text-label-sm flex h-10 shrink-0 items-center gap-2 rounded-button px-2 font-mono uppercase tracking-wide text-text-muted active:bg-surface-3"
        >
          Auto-inicio
          <span
            className={
              "grid size-6 place-items-center rounded-card border " +
              (autoDescanso ? "border-accent bg-accent text-on-accent" : "border-border text-transparent")
            }
          >
            <MaterialIcon nombre="check" tamano={16} />
          </span>
        </button>
      </div>
    </section>
  );
}
