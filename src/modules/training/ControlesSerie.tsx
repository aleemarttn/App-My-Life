import { MaterialIcon } from "@/core/ui/MaterialIcon";
import { Pill } from "@/core/ui/Pill";
import { reloj, textoReps } from "./formato";
import type { ObjetivoPautado } from "./formato";

/** D30: el selector ensena RPE, la base guarda RIR. Tabla 1 a 1, sin migracion. */
const RPE_A_RIR: Record<number, number> = { 10: 0, 9: 1, 8: 2, 7: 3, 6: 4, 5: 5 };
const RPE_OPCIONES = [10, 9, 8, 7, 6, 5];
const INCREMENTOS_PESO = [-5, -2.5, 2.5, 5];

function redondear(n: number): number {
  return Math.round(n * 100) / 100;
}

interface ControlesSerieProps {
  numeroSerie: number;
  totalSeries: number;
  objetivo: ObjetivoPautado;
  peso: number;
  onPeso: (valor: number) => void;
  reps: number;
  onReps: (valor: number) => void;
  rir: number | null;
  onRir: (valor: number) => void;
  descansoSegundos: number;
  autoDescanso: boolean;
  onAutoDescanso: (valor: boolean) => void;
}

/**
 * Los tres controles con los que se registra una serie, mas el descanso
 * que viene despues. Carga, reps y esfuerzo, en ese orden: es el orden en
 * el que se miran de pie delante de la barra.
 */
export function ControlesSerie({
  numeroSerie,
  totalSeries,
  objetivo,
  peso,
  onPeso,
  reps,
  onReps,
  rir,
  onRir,
  descansoSegundos,
  autoDescanso,
  onAutoDescanso,
}: ControlesSerieProps) {
  const repsObjetivo = textoReps(objetivo);

  return (
    <section className="rounded-card border border-accent/30 bg-surface p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="size-2 animate-pulse rounded-chip bg-accent" />
          <h2 className="text-title">
            Serie {numeroSerie} de {totalSeries}
          </h2>
        </div>
        <Pill color="accent">Efectiva</Pill>
      </div>

      <div className="mb-4">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <p className="text-label-md uppercase tracking-wide text-text-muted">Carga total</p>
          {objetivo.target_weight != null && (
            <p className="text-label-md tabular-nums text-accent">Pautado: {objetivo.target_weight} kg</p>
          )}
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
          <p className="text-label-md uppercase tracking-wide text-text-muted">Repeticiones conseguidas</p>
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
          <p className="text-label-md uppercase tracking-wide text-text-muted">Esfuerzo percibido (RPE)</p>
          <p className="text-label-md text-accent">
            {rir != null ? `${rir} reps en reserva (RIR ${rir})` : "Sin marcar"}
          </p>
        </div>
        <div className="flex gap-1.5">
          {RPE_OPCIONES.map((rpe) => {
            const rirDeEsteRpe = RPE_A_RIR[rpe]!;
            const activo = rir === rirDeEsteRpe;
            return (
              <button
                key={rpe}
                type="button"
                onClick={() => onRir(rirDeEsteRpe)}
                aria-pressed={activo}
                className={
                  "text-label h-touch flex-1 rounded-button font-mono tabular-nums " +
                  (activo ? "bg-accent text-on-accent" : "bg-surface-2 text-text-muted active:bg-border")
                }
              >
                {rpe}
              </button>
            );
          })}
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
