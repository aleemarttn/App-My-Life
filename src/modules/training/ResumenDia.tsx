import { useNavigate } from "react-router";
import { Button } from "@/core/ui/Button";
import { MaterialIcon } from "@/core/ui/MaterialIcon";
import { Pill } from "@/core/ui/Pill";
import { objetivoSesion, reloj } from "./formato";
import type { ProximoEntreno } from "./proximoEntreno";

/** Los grupos musculares del dia, sin repetir, en el orden de la rutina. */
function gruposDe(proximo: ProximoEntreno): string[] {
  const vistos: string[] = [];
  for (const item of proximo.ejercicios) {
    const grupo = item.exercise?.muscle_group;
    if (grupo && !vistos.includes(grupo)) vistos.push(grupo);
  }
  return vistos;
}

interface ResumenDiaProps {
  proximo: ProximoEntreno;
}

/**
 * La portada de Entreno antes de empezar (D31): el dia entero de un
 * vistazo, para saber a que te metes antes de darle a Iniciar.
 *
 * Todo lo que sale aqui viene del Excel importado (`routine_exercises`):
 * series, reps, peso, RIR y descanso pautados. No se calcula ninguna
 * metrica -- ni volumen, ni porcentajes, ni previsiones.
 */
export function ResumenDia({ proximo }: ResumenDiaProps) {
  const navigate = useNavigate();
  const grupos = gruposDe(proximo);
  const seriesPautadas = proximo.ejercicios.reduce(
    (total, item) => total + (item.routineExercise.target_sets ?? 1),
    0,
  );

  return (
    <section className="rounded-card border border-border bg-surface p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-label-md uppercase tracking-wide text-text-muted">
            {proximo.terminado ? "Mesociclo terminado" : "Te toca"}
          </p>
          <h2 className="text-title-lg truncate">{proximo.dia.label}</h2>
          <p className="text-caption truncate text-text-muted">
            {proximo.rutina.name} · semana {proximo.dia.week_number} · día {proximo.indice + 1} de{" "}
            {proximo.total}
          </p>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <Pill color="accent">{`${proximo.ejercicios.length} ejercicios`}</Pill>
        <Pill color="accent-2">{`${seriesPautadas} series`}</Pill>
        {grupos.map((grupo) => (
          <Pill key={grupo}>{grupo}</Pill>
        ))}
      </div>

      <ul className="mb-4 divide-y divide-border">
        {proximo.ejercicios.map((item, indice) => (
          <li key={item.routineExercise.id}>
            <button
              type="button"
              disabled={!item.exercise}
              onClick={() => item.exercise && navigate(`/entreno/ejercicio/${item.exercise.id}`)}
              className="flex w-full items-center gap-3 py-2.5 text-left active:opacity-70"
            >
              <span className="text-label-md w-6 shrink-0 font-mono tabular-nums text-text-faint">
                {indice + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-body truncate text-text">{item.exercise?.name ?? "Ejercicio sin catálogo"}</p>
                <p className="text-caption truncate tabular-nums text-text-muted">
                  {objetivoSesion(item.routineExercise)}
                </p>
              </div>
              {item.routineExercise.rest_seconds != null && (
                <span className="text-caption flex shrink-0 items-center gap-1 font-mono tabular-nums text-text-muted">
                  <MaterialIcon nombre="schedule" tamano={14} />
                  {reloj(item.routineExercise.rest_seconds)}
                </span>
              )}
              {item.routineExercise.notes && (
                <MaterialIcon nombre="sticky_note_2" tamano={16} className="shrink-0 text-accent-3" />
              )}
            </button>
          </li>
        ))}
      </ul>

      <Button onClick={() => navigate("/entreno/modo")}>Iniciar entrenamiento</Button>
    </section>
  );
}
