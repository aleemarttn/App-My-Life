import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/core/db";
import { Button } from "@/core/ui/Button";
import { Chip } from "@/core/ui/Chip";
import { MaterialIcon } from "@/core/ui/MaterialIcon";
import { Stepper } from "@/core/ui/Stepper";
import type { Tables } from "@/core/supabase/types";
import { e1rm } from "./metricas";
import { SustituirSheet } from "./SustituirSheet";
import { useUltimaSerieDe } from "./useUltimaSerieDe";
import { VideoSheet } from "./VideoSheet";
import type { EntradaSerie, ObjetivoPlan, PasoActual } from "./useSesionEntreno";

const RPE_A_RIR: Record<number, number> = { 10: 0, 9: 1, 8: 2, 7: 3, 6: 4, 5: 5 };
const RPE_OPCIONES = [10, 9, 8, 7, 6, 5];
const INCREMENTOS_PESO = [-5, -2.5, 2.5, 5];

const TAGS: { valor: string; etiqueta: string }[] = [
  { valor: "facil", etiqueta: "fácil" },
  { valor: "al_fallo", etiqueta: "al fallo" },
  { valor: "molestia", etiqueta: "molestia" },
];

function redondear(n: number): number {
  return Math.round(n * 100) / 100;
}

interface HudSesionProps {
  iniciadaEn: string;
  onTerminar: () => void;
}

function HudSesion({ iniciadaEn, onTerminar }: HudSesionProps) {
  const [pausado, setPausado] = useState(false);
  const [ahora, setAhora] = useState(() => Date.now());
  const [confirmandoFin, setConfirmandoFin] = useState(false);

  useEffect(() => {
    if (pausado) return;
    const id = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(id);
  }, [pausado]);

  const segundos = Math.max(0, Math.floor((ahora - new Date(iniciadaEn).getTime()) / 1000));
  const mm = Math.floor(segundos / 60).toString().padStart(2, "0");
  const ss = (segundos % 60).toString().padStart(2, "0");

  return (
    <div className="flex items-center justify-between gap-2 rounded-card bg-surface-2 px-3 py-2">
      <div className="flex items-center gap-1.5">
        <span className={"size-2 rounded-chip bg-accent" + (pausado ? "" : " animate-pulse")} />
        <span className="text-label-md uppercase tracking-wide text-accent">
          {pausado ? "En pausa" : "En vivo"}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <MaterialIcon nombre="timer" tamano={16} className="text-accent-2" />
        <span className="font-mono text-metric-md tabular-nums text-text">
          {mm}:{ss}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setPausado((p) => !p)}
          className="text-label-md flex items-center gap-1 rounded-button bg-surface-3 px-2 py-1 uppercase tracking-wide text-text active:bg-border"
        >
          <MaterialIcon nombre={pausado ? "play_arrow" : "pause"} tamano={14} />
          {pausado ? "Seguir" : "Pausar"}
        </button>
        <button
          type="button"
          onClick={() => (confirmandoFin ? onTerminar() : setConfirmandoFin(true))}
          className="text-label-md flex items-center gap-1 rounded-button bg-danger/10 px-2 py-1 uppercase tracking-wide text-danger active:opacity-80"
        >
          <MaterialIcon nombre="stop" tamano={14} />
          {confirmandoFin ? "¿Seguro?" : "Fin"}
        </button>
      </div>
    </div>
  );
}

function textoObjetivo(planned: ObjetivoPlan): string {
  const partes: string[] = [];

  if (planned.target_weight != null) partes.push(`${planned.target_weight} kg`);

  const { target_reps_min: min, target_reps_max: max } = planned;
  if (min != null || max != null) {
    const reps = min != null && max != null && min !== max ? `${min}-${max}` : `${max ?? min}`;
    partes.push(`${reps} reps`);
  }

  if (planned.target_duration_seconds != null) {
    const s = planned.target_duration_seconds;
    partes.push(s >= 60 ? `${Math.round(s / 60)} min` : `${s} s`);
  }
  if (planned.target_distance_m != null) {
    const m = planned.target_distance_m;
    partes.push(m >= 1000 ? `${m / 1000} km` : `${m} m`);
  }

  return partes.join(" × ") || "Sin objetivo pautado";
}

interface SerieActivaProps {
  paso: PasoActual;
  sesion: Tables<"workout_sessions">;
  logsDelEjercicioActual: Tables<"set_logs">[];
  onConfirmar: (entrada: EntradaSerie) => void;
  onSaltar: () => void;
  onSustituir: (nuevoExerciseId: string, motivo: string) => void;
  onTerminarSesion: () => void;
}

export function SerieActiva({
  paso,
  sesion,
  logsDelEjercicioActual,
  onConfirmar,
  onSaltar,
  onSustituir,
  onTerminarSesion,
}: SerieActivaProps) {
  const ejercicio = useLiveQuery(
    () => db.exercises.get(paso.sessionExercise.exercise_id),
    [paso.sessionExercise.exercise_id],
  );

  const { planned } = paso;
  const [reps, setReps] = useState(planned.target_reps_max ?? planned.target_reps_min ?? 10);
  const [peso, setPeso] = useState(planned.target_weight ?? 0);
  const [rir, setRir] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [notaAbierta, setNotaAbierta] = useState(false);
  const [nota, setNota] = useState("");
  const [sustituyendo, setSustituyendo] = useState(false);
  const [mostrandoVideo, setMostrandoVideo] = useState(false);

  const ultimaSerie = useUltimaSerieDe(paso.sessionExercise.exercise_id, sesion.id);
  const esFuerza = !ejercicio || ejercicio.kind === "strength";
  const e1rmEnVivo = esFuerza && peso > 0 && reps > 0 ? e1rm(peso, reps) : null;

  function alternarTag(valor: string): void {
    setTags((actual) => (actual.includes(valor) ? actual.filter((t) => t !== valor) : [...actual, valor]));
  }

  function copiarUltimaSerie(): void {
    if (!ultimaSerie) return;
    if (ultimaSerie.peso != null) setPeso(ultimaSerie.peso);
    if (ultimaSerie.reps != null) setReps(ultimaSerie.reps);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-bg px-4 pt-safe">
      <div className="pt-3">
        <HudSesion iniciadaEn={sesion.started_at} onTerminar={onTerminarSesion} />
      </div>

      <header className="flex items-center justify-between gap-3 py-4">
        <div className="min-w-0">
          <p className="text-label-md uppercase tracking-wide text-accent-3">
            Serie {paso.numeroSerie} de {paso.totalSeries}
          </p>
          <h1 className="text-title truncate">{ejercicio?.name ?? "Cargando..."}</h1>
        </div>
        {ejercicio?.video_url && (
          <button
            type="button"
            onClick={() => setMostrandoVideo(true)}
            aria-label="Ver vídeo del ejercicio"
            className="size-touch grid shrink-0 place-items-center rounded-chip bg-surface-2 text-text-muted"
          >
            <MaterialIcon nombre="play_circle" tamano={22} />
          </button>
        )}
      </header>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-card bg-surface-2 p-2.5">
          <p className="text-label-md uppercase text-text-muted">Objetivo sesión</p>
          <p className="text-title-lg tabular-nums">{textoObjetivo(planned)}</p>
        </div>
        <div className="rounded-card bg-surface-2 p-2.5">
          <p className="text-label-md uppercase text-text-muted">e1RM estimado</p>
          <p className="font-mono text-metric-md tabular-nums text-accent-2">
            {e1rmEnVivo != null ? `${e1rmEnVivo.toFixed(1)} kg` : "—"}
          </p>
        </div>
      </div>

      {ultimaSerie && (
        <button
          type="button"
          onClick={copiarUltimaSerie}
          className="mt-2 flex items-center justify-between rounded-button bg-surface-2 px-3 py-2 text-left active:bg-border"
        >
          <span className="text-label text-text-muted">
            Copiar última: {ultimaSerie.peso ?? "—"} kg × {ultimaSerie.reps ?? "—"} reps
          </span>
          <span className="text-label-md rounded-chip bg-surface-3 px-2 py-0.5 uppercase text-accent">1-tap</span>
        </button>
      )}

      <div className="flex flex-1 flex-col justify-center gap-5 py-4">
        <Stepper etiqueta="Repeticiones" valor={reps} onCambiar={setReps} sufijo="reps" />

        <div>
          <p className="text-label mb-2 text-center text-text-muted">Peso</p>
          <div className="mx-auto flex h-touch-stepper max-w-96 items-stretch overflow-hidden rounded-button border border-border">
            {INCREMENTOS_PESO.slice(0, 2).map((inc) => (
              <button
                key={inc}
                type="button"
                onClick={() => setPeso((v) => Math.max(0, redondear(v + inc)))}
                aria-label={`${inc > 0 ? "Sumar" : "Restar"} ${Math.abs(inc)} kg`}
                className="w-touch-stepper shrink-0 bg-surface-2 text-label text-text active:bg-border"
              >
                {inc > 0 ? `+${inc}` : inc}
              </button>
            ))}
            <div className="flex flex-1 items-center justify-center border-x border-border bg-surface">
              <span className="font-mono text-title-lg tabular-nums">{peso} kg</span>
            </div>
            {INCREMENTOS_PESO.slice(2).map((inc) => (
              <button
                key={inc}
                type="button"
                onClick={() => setPeso((v) => Math.max(0, redondear(v + inc)))}
                aria-label={`${inc > 0 ? "Sumar" : "Restar"} ${Math.abs(inc)} kg`}
                className="w-touch-stepper shrink-0 bg-surface-2 text-label text-text active:bg-border"
              >
                {inc > 0 ? `+${inc}` : inc}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-label mb-2 text-center text-text-muted">RPE</p>
          <div className="flex justify-center gap-2">
            {RPE_OPCIONES.map((rpe) => {
              const rirDeEsteRpe = RPE_A_RIR[rpe]!;
              return (
                <button
                  key={rpe}
                  type="button"
                  onClick={() => setRir(rirDeEsteRpe)}
                  aria-pressed={rir === rirDeEsteRpe}
                  className={
                    "size-touch rounded-chip font-mono text-label tabular-nums " +
                    (rir === rirDeEsteRpe ? "bg-accent text-on-accent" : "bg-surface-2 text-text-muted active:bg-border")
                  }
                >
                  {rpe}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {TAGS.map((t) => (
            <Chip key={t.valor} activo={tags.includes(t.valor)} onClick={() => alternarTag(t.valor)}>
              {t.etiqueta}
            </Chip>
          ))}
        </div>

        {notaAbierta ? (
          <textarea
            autoFocus
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Nota para tu entrenador..."
            rows={2}
            className="text-body w-full rounded-button border border-border bg-surface-2 px-4 py-3 text-text placeholder:text-text-faint"
          />
        ) : (
          <button
            type="button"
            onClick={() => setNotaAbierta(true)}
            className="text-label h-touch self-center text-text-muted"
          >
            + nota
          </button>
        )}
      </div>

      <div className="mb-3">
        <p className="text-label-md mb-1.5 uppercase tracking-wide text-text-muted">Secuencia de series</p>
        <ul className="space-y-1">
          {Array.from({ length: paso.totalSeries }, (_, i) => i + 1).map((numero) => {
            const log = logsDelEjercicioActual[numero - 1];
            const esActual = numero === paso.numeroSerie;
            return (
              <li
                key={numero}
                className={
                  "flex items-center justify-between rounded-button px-3 py-2 " +
                  (esActual ? "bg-surface-2" : "bg-transparent")
                }
              >
                <span className="text-label text-text-muted">#{numero}</span>
                {log ? (
                  <span className="text-label tabular-nums text-text">
                    {log.weight ?? "—"} kg × {log.reps ?? "—"} reps
                  </span>
                ) : esActual ? (
                  <span className="text-label-md uppercase text-accent-3">En curso</span>
                ) : (
                  <span className="text-label-md flex items-center gap-1 uppercase text-text-faint">
                    <MaterialIcon nombre="lock" tamano={12} />
                    Pendiente
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="sticky bottom-0 space-y-3 bg-bg pb-safe pt-3">
        <Button onClick={() => onConfirmar({ reps, peso, rir, tags, nota })}>SERIE COMPLETADA</Button>
        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={() => setSustituyendo(true)}>
            sustituir
          </Button>
          <Button variant="ghost" className="flex-1" onClick={onSaltar}>
            saltar
          </Button>
        </div>
      </div>

      {sustituyendo && (
        <SustituirSheet
          exerciseActualId={paso.sessionExercise.exercise_id}
          onCerrar={() => setSustituyendo(false)}
          onSustituir={(nuevoId, motivo) => {
            setSustituyendo(false);
            onSustituir(nuevoId, motivo);
          }}
        />
      )}

      {mostrandoVideo && ejercicio?.video_url && (
        <VideoSheet
          videoUrl={ejercicio.video_url}
          titulo={ejercicio.name}
          onCerrar={() => setMostrandoVideo(false)}
        />
      )}
    </div>
  );
}
