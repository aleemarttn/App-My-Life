import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate } from "react-router";
import { db } from "@/core/db";
import { Button } from "@/core/ui/Button";
import type { Tables } from "@/core/supabase/types";
import { CabeceraEjercicio } from "./CabeceraEjercicio";
import { ControlesSerie } from "./ControlesSerie";
import { CopiarUltima } from "./CopiarUltima";
import { HudSesion } from "./HudSesion";
import { e1rm } from "./metricas";
import { NotasSerie } from "./NotasSerie";
import { SecuenciaSeries } from "./SecuenciaSeries";
import { SustituirSheet } from "./SustituirSheet";
import { useUltimaSerieDe } from "./useUltimaSerieDe";
import { VideoSheet } from "./VideoSheet";
import type { EntradaSerie, PasoActual } from "./useSesionEntreno";

interface SerieActivaProps {
  paso: PasoActual;
  sesion: Tables<"workout_sessions">;
  logsDelEjercicioActual: Tables<"set_logs">[];
  autoDescanso: boolean;
  onAutoDescanso: (valor: boolean) => void;
  onConfirmar: (entrada: EntradaSerie) => void;
  onSaltar: () => void;
  onSustituir: (nuevoExerciseId: string, motivo: string) => void;
  onSalir: () => void;
  onTerminarSesion: () => void;
}

/**
 * La pantalla que decide el proyecto (spec §4.7). Sigue siendo secuencial
 * y bloqueante: una sola serie editable, un paso cada vez. La secuencia de
 * series de abajo y la cabecera del ejercicio son de solo lectura.
 */
export function SerieActiva({
  paso,
  sesion,
  logsDelEjercicioActual,
  autoDescanso,
  onAutoDescanso,
  onConfirmar,
  onSaltar,
  onSustituir,
  onSalir,
  onTerminarSesion,
}: SerieActivaProps) {
  const navigate = useNavigate();
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

  const resumenRegistro = [
    `Serie ${paso.numeroSerie}`,
    esFuerza ? `${peso} kg` : null,
    `${reps} reps`,
    rir != null ? `RPE ${10 - rir}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="min-h-dvh bg-bg px-4 pt-safe">
      <div className="sticky top-0 z-10 -mx-4 bg-bg/95 px-4 pb-2 pt-3 backdrop-blur">
        <HudSesion iniciadaEn={sesion.started_at} onSalir={onSalir} onTerminar={onTerminarSesion} />
      </div>

      <div className="space-y-3">
        <CabeceraEjercicio
          ejercicio={ejercicio}
          indice={paso.indiceEjercicio}
          total={paso.totalEjercicios}
          objetivo={planned}
          e1rmEnVivo={e1rmEnVivo}
          onVerHistorial={() => navigate(`/entreno/ejercicio/${paso.sessionExercise.exercise_id}`)}
          onVerVideo={() => setMostrandoVideo(true)}
        />

        {ultimaSerie && (
          <CopiarUltima
            peso={ultimaSerie.peso}
            reps={ultimaSerie.reps}
            onCopiar={() => {
              if (ultimaSerie.peso != null) setPeso(ultimaSerie.peso);
              if (ultimaSerie.reps != null) setReps(ultimaSerie.reps);
            }}
          />
        )}

        <ControlesSerie
          numeroSerie={paso.numeroSerie}
          totalSeries={paso.totalSeries}
          objetivo={planned}
          peso={peso}
          onPeso={setPeso}
          reps={reps}
          onReps={setReps}
          rir={rir}
          onRir={setRir}
          descansoSegundos={paso.descansoSegundos}
          autoDescanso={autoDescanso}
          onAutoDescanso={onAutoDescanso}
        />

        <NotasSerie
          tags={tags}
          onTags={setTags}
          nota={nota}
          onNota={setNota}
          abierta={notaAbierta}
          onAbrir={() => setNotaAbierta(true)}
        />

        <section className="rounded-card border border-border bg-surface p-4">
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <h2 className="text-label-md uppercase tracking-wide text-text-muted">Secuencia de series</h2>
            <span className="text-label-md font-mono tabular-nums text-text-muted">
              {logsDelEjercicioActual.length} de {paso.totalSeries}
            </span>
          </div>
          <SecuenciaSeries
            totalSeries={paso.totalSeries}
            objetivo={planned}
            logs={logsDelEjercicioActual}
            numeroActual={paso.numeroSerie}
          />
        </section>

        <div className="flex gap-3 pb-32">
          <Button variant="secondary" className="flex-1" onClick={() => setSustituyendo(true)}>
            Sustituir
          </Button>
          <Button variant="secondary" className="flex-1" onClick={onSaltar}>
            Saltar
          </Button>
        </div>
      </div>

      {/* El registro vive en la zona del pulgar (design.md §1 y §5), no en
          medio de la pagina: es lo unico que se pulsa de pie y sudando. */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-bg/95 px-4 pt-3 backdrop-blur pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        <Button
          className="h-auto min-h-touch-primary py-2 leading-tight"
          onClick={() => onConfirmar({ reps, peso, rir, tags, nota })}
        >
          Registrar {resumenRegistro}
        </Button>
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
