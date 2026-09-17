import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/core/db";
import { Button } from "@/core/ui/Button";
import { Chip } from "@/core/ui/Chip";
import { Stepper } from "@/core/ui/Stepper";
import { SustituirSheet } from "./SustituirSheet";
import type { EntradaSerie, PasoActual } from "./useSesionEntreno";

const RIR_OPCIONES = [0, 1, 2, 3, 4, 5];

/**
 * Solo 3 de las 7 etiquetas de spec §4.4: son las que trae el wireframe de
 * la pantalla 3. El resto entra si la prueba en el gimnasio pide mas.
 */
const TAGS: { valor: string; etiqueta: string }[] = [
  { valor: "facil", etiqueta: "fácil" },
  { valor: "al_fallo", etiqueta: "al fallo" },
  { valor: "molestia", etiqueta: "molestia" },
];

interface SerieActivaProps {
  paso: PasoActual;
  onConfirmar: (entrada: EntradaSerie) => void;
  onSaltar: () => void;
  onSustituir: (nuevoExerciseId: string, motivo: string) => void;
}

/**
 * Pantalla 3 del wireframe (spec §4.7): la serie activa, una a una. Sin
 * `key` en el uso de este componente el estado de los steppers y del RIR se
 * arrastraria de una serie a la siguiente, que es justo lo que evita el
 * padre remontandolo por sesion+numero de serie.
 */
export function SerieActiva({ paso, onConfirmar, onSaltar, onSustituir }: SerieActivaProps) {
  const ejercicio = useLiveQuery(
    () => db.exercises.get(paso.sessionExercise.exercise_id),
    [paso.sessionExercise.exercise_id],
  );

  const [reps, setReps] = useState(paso.planned.target_reps_max);
  const [peso, setPeso] = useState(paso.planned.target_weight);
  const [rir, setRir] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [notaAbierta, setNotaAbierta] = useState(false);
  const [nota, setNota] = useState("");
  const [sustituyendo, setSustituyendo] = useState(false);

  function alternarTag(valor: string): void {
    setTags((actual) => (actual.includes(valor) ? actual.filter((t) => t !== valor) : [...actual, valor]));
  }

  return (
    <div className="flex min-h-dvh flex-col bg-bg px-4 pt-safe">
      <header className="flex items-center justify-between py-4">
        <div>
          <h1 className="text-title truncate">{ejercicio?.name ?? "Cargando..."}</h1>
          <p className="text-label text-text-muted">
            Serie {paso.numeroSerie} de {paso.planned.target_sets}
          </p>
        </div>
        {ejercicio?.video_url && (
          <a
            href={ejercicio.video_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Ver vídeo del ejercicio"
            className="size-touch grid shrink-0 place-items-center rounded-chip bg-surface-2 text-text-muted"
          >
            ▶
          </a>
        )}
      </header>

      <div className="flex flex-1 flex-col justify-center gap-6">
        <p className="text-title-lg text-center tabular-nums">
          {paso.planned.target_weight} kg × {paso.planned.target_reps_max} reps
        </p>

        <Stepper etiqueta="Repeticiones" valor={reps} onCambiar={setReps} sufijo="reps" />
        <Stepper etiqueta="Peso" valor={peso} onCambiar={setPeso} incremento={2.5} sufijo="kg" />

        <div>
          <p className="text-label mb-2 text-text-muted">RIR</p>
          <div className="flex justify-center gap-2">
            {RIR_OPCIONES.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRir(n)}
                aria-pressed={rir === n}
                className={
                  "size-touch rounded-chip text-label tabular-nums " +
                  (rir === n ? "bg-accent text-on-accent" : "bg-surface-2 text-text-muted active:bg-border")
                }
              >
                {n}
              </button>
            ))}
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
    </div>
  );
}
