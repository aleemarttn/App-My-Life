import { useEffect, useRef, useState } from "react";
import { Pill } from "@/core/ui/Pill";
import { textoReps } from "./formato";
import type { ObjetivoPautado } from "./formato";

const RIR_OPCIONES = [0, 1, 2, 3, 4, 5];
const INCREMENTOS_PESO = [-5, -2.5, 2.5, 5];

function redondear(n: number): number {
  return Math.round(n * 100) / 100;
}

interface ValorTecleableProps {
  valor: string;
  onCambiar: (valor: number) => void;
  ariaLabel: string;
  className: string;
}

/**
 * El numero de la carga o de las reps, tocable para teclear un valor exacto.
 *
 * Bug real encontrado en el gimnasio (23/09/2026, D38): los botones +/- de
 * la carga solo mueven de 2,5 en 2,5 kg. Si el disco minimo del gimnasio es
 * de 1 kg o de 1,25 kg, no hay combinacion de esos botones que llegue al
 * peso exacto. Se mantienen los botones para el caso normal (mas rapido,
 * sin teclado) y se anade este teclado del sistema SOLO al tocar la cifra,
 * para el caso en que hace falta precision que los saltos fijos no dan.
 */
function ValorTecleable({ valor, onCambiar, ariaLabel, className }: ValorTecleableProps) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(valor);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editando) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [editando]);

  function confirmar(): void {
    const n = Number(texto.replace(",", "."));
    if (Number.isFinite(n) && n >= 0) onCambiar(redondear(n));
    setEditando(false);
  }

  if (editando) {
    return (
      <input
        ref={inputRef}
        type="number"
        inputMode="decimal"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onBlur={confirmar}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") setEditando(false);
        }}
        aria-label={ariaLabel}
        className={`${className} w-full bg-transparent text-center outline-none`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setTexto(valor);
        setEditando(true);
      }}
      aria-label={`${ariaLabel}. Toca para escribir un número exacto`}
      className={className}
    >
      {valor}
    </button>
  );
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
  isWarmup: boolean;
  onWarmup: (valor: boolean) => void;
}

/**
 * Los controles con los que se registra una serie: carga, reps, RIR y
 * calentamiento. Es la pantalla minima (spec §4.7): solo lo necesario para
 * rellenar la serie y el objetivo pautado, nada mas.
 *
 * Recortado el 23/09/2026 (D39) a peticion de Alejandro tras la primera
 * prueba real en el gimnasio: RPE, e1RM, secuencia de series, copiar
 * ultima, notas/etiquetas, sustituir/saltar y el auto-inicio del descanso
 * salen de esta pantalla. Nada de eso se borra del modelo de datos ni del
 * resto de la app -- ver D39 en decisiones.md para donde queda cada cosa.
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
  isWarmup,
  onWarmup,
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
            <ValorTecleable
              valor={peso.toFixed(1)}
              onCambiar={(v) => onPeso(Math.max(0, v))}
              ariaLabel="Carga en kilos"
              className="font-mono text-metric-xl tabular-nums text-text"
            />
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
            <ValorTecleable
              valor={String(reps)}
              onCambiar={(v) => onReps(Math.max(0, Math.round(v)))}
              ariaLabel="Repeticiones"
              className="font-mono text-metric-xl tabular-nums text-text"
            />
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

      <div>
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
    </section>
  );
}
