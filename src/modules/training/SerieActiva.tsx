import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate } from "react-router";
import { db } from "@/core/db";
import { Button } from "@/core/ui/Button";
import { MaterialIcon } from "@/core/ui/MaterialIcon";
import type { Tables } from "@/core/supabase/types";
import { CabeceraEjercicio } from "./CabeceraEjercicio";
import { ControlesSerie } from "./ControlesSerie";
import { useUltimaSerieDe } from "./useUltimaSerieDe";
import { VideoSheet } from "./VideoSheet";
import type { EntradaSerie, PasoActual } from "./useSesionEntreno";

interface SerieActivaProps {
  paso: PasoActual;
  sesion: Tables<"workout_sessions">;
  onConfirmar: (entrada: EntradaSerie) => void;
  /** Sale a la pestana de Entreno DEJANDO la sesion viva (D31). */
  onSalir: () => void;
}

/**
 * La pantalla que decide el proyecto (spec §4.7). Secuencial y bloqueante:
 * una sola serie editable, un paso cada vez.
 *
 * Recortada el 23/09/2026 (D39) a peticion de Alejandro, tras la primera
 * prueba real en el gimnasio: solo el objetivo de la serie y los botones
 * para rellenarla. El cronometro, pausar/terminar, RPE, e1RM en vivo,
 * secuencia de series, copiar ultima, notas/etiquetas y sustituir/saltar
 * salen de esta pantalla concreta -- se quedan en `SesionEnCurso`, la
 * portada de la sesion en curso, que es donde se mira como va el entreno.
 */
export function SerieActiva({ paso, sesion, onConfirmar, onSalir }: SerieActivaProps) {
  const navigate = useNavigate();
  const ejercicio = useLiveQuery(
    () => db.exercises.get(paso.sessionExercise.exercise_id),
    [paso.sessionExercise.exercise_id],
  );

  // La nota del entrenador vive en la rutina, no en el snapshot de la
  // sesion: se lee de `routine_exercises`, que es donde la dejo el Excel.
  const routineExercise = useLiveQuery(async () => {
    const id = paso.sessionExercise.routine_exercise_id;
    return id ? await db.routine_exercises.get(id) : undefined;
  }, [paso.sessionExercise.routine_exercise_id]);

  const { planned } = paso;
  const [reps, setReps] = useState(planned.target_reps_max ?? planned.target_reps_min ?? 10);
  // Null mientras no se toque el stepper: el peso de partida se deriva
  // abajo, porque la ultima serie llega de Dexie despues del primer render.
  const [pesoElegido, setPesoElegido] = useState<number | null>(planned.target_weight);
  const [rir, setRir] = useState<number | null>(planned.target_rir);
  const [isWarmup, setIsWarmup] = useState(false);
  const [mostrandoVideo, setMostrandoVideo] = useState(false);

  const ultimaSerie = useUltimaSerieDe(paso.sessionExercise.exercise_id, sesion.id);

  // Cuando el Excel no pauta peso -- que es el caso de la rutina real: 0 de
  // sus 39 filas lo trae -- el punto de partida util es lo que se movio la
  // ultima vez, no un 0,0 kg que hay que subir a golpe de boton.
  const peso = pesoElegido ?? ultimaSerie?.peso ?? 0;

  const resumenRegistro = [`${peso} kg`, `${reps} reps`, rir != null ? `RIR ${rir}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="min-h-dvh bg-bg px-4 pt-safe">
      <button
        type="button"
        onClick={onSalir}
        aria-label="Volver a Entreno sin terminar la sesión"
        className="text-label-sm -ml-1 mt-3 flex h-touch shrink-0 items-center gap-1 rounded-button pr-2 font-mono uppercase tracking-wide text-text-muted active:bg-surface-2"
      >
        <MaterialIcon nombre="arrow_back" tamano={20} />
        Entreno
      </button>

      {/* pb-32: deja hueco de sobra para que el ultimo bloque (RIR) no quede
          tapado por el boton fijo de "Registrar". Sin el, con la pantalla
          recortada (D39) el contenido apenas llega a la altura de la
          pantalla y no hay ni un pixel de mas que deslizar para revelarlo. */}
      <div className="space-y-3 pt-2 pb-32">
        <CabeceraEjercicio
          ejercicio={ejercicio}
          indice={paso.indiceEjercicio}
          total={paso.totalEjercicios}
          objetivo={planned}
          notaEntrenador={routineExercise?.notes ?? null}
          onVerHistorial={() => navigate(`/entreno/ejercicio/${paso.sessionExercise.exercise_id}`)}
          onVerVideo={() => setMostrandoVideo(true)}
        />

        <ControlesSerie
          numeroSerie={paso.numeroSerie}
          totalSeries={paso.totalSeries}
          objetivo={planned}
          pesoReferencia={ultimaSerie?.peso ?? null}
          peso={peso}
          onPeso={setPesoElegido}
          reps={reps}
          onReps={setReps}
          rir={rir}
          onRir={setRir}
          isWarmup={isWarmup}
          onWarmup={setIsWarmup}
        />
      </div>

      {/* El registro vive en la zona del pulgar (design.md §1 y §5), no en
          medio de la pagina: es lo unico que se pulsa de pie y sudando. */}
      <div className="pb-accion-safe fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/95 px-4 pt-3 backdrop-blur">
        <Button
          className="h-auto min-h-touch-primary py-2 leading-tight"
          onClick={() =>
            onConfirmar({ reps, peso, rir, rpe: null, tags: [], nota: "", isWarmup })
          }
        >
          Registrar {isWarmup ? "calentamiento · " : ""}{resumenRegistro}
        </Button>
      </div>

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
