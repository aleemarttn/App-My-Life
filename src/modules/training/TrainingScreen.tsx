import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate } from "react-router";
import { db, usuarioActualId } from "@/core/db";
import { Button } from "@/core/ui/Button";
import { Card } from "@/core/ui/Card";
import { EmptyState } from "@/core/ui/EmptyState";
import { CalendarioSemana } from "./CalendarioSemana";
import { objetivoCorto } from "./formato";
import { calcularProximoEntreno, calcularSemanaActual } from "./proximoEntreno";

/** Lunes a las 00:00 de la semana de `fecha` (semana ISO, no la del domingo). */
function inicioDeSemana(fecha: Date): Date {
  const d = new Date(fecha);
  const dia = d.getDay();
  d.setDate(d.getDate() + (dia === 0 ? -6 : 1 - dia));
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Portada del modulo de entrenamiento (pantalla 2 del wireframe, spec §7):
 * resumen de la semana, el calendario de la semana en curso del mesociclo y
 * el entreno que toca, con el boton que lleva al modo entreno (pantalla 3).
 * Registrar una serie nunca deberia ser la primera pantalla que se ve:
 * primero se orienta, luego se actua (design.md §1).
 *
 * Falta de la fase 1: el exportador y las vistas globales de §4.9 —volumen
 * por grupo muscular, adherencia y molestias recurrentes—.
 */
export function TrainingScreen() {
  const navigate = useNavigate();
  const userId = usuarioActualId();

  const entrenosEstaSemana = useLiveQuery(
    async () => {
      if (!userId) return 0;
      const desde = inicioDeSemana(new Date()).toISOString();
      return db.workout_sessions
        .where("user_id")
        .equals(userId)
        .filter((s) => s.started_at >= desde && s.ended_at != null && s.deleted_at == null)
        .count();
    },
    [userId],
    0,
  );

  const sesionActiva = useLiveQuery(
    async () => {
      if (!userId) return undefined;
      const sesiones = await db.workout_sessions
        .where("user_id")
        .equals(userId)
        .filter((s) => s.ended_at == null && s.deleted_at == null)
        .toArray();
      return sesiones.at(-1);
    },
    [userId],
    undefined,
  );

  const proximo = useLiveQuery(async () => (userId ? await calcularProximoEntreno(userId) : null), [userId]);
  const semana = useLiveQuery(async () => (userId ? await calcularSemanaActual(userId) : null), [userId]);

  if (proximo === undefined) return null; // Dexie responde en milisegundos

  if (proximo === null) {
    return (
      <EmptyState
        titulo="Todavía no hay rutina"
        descripcion="Importa el Excel de tu entrenador y la app se encarga del resto."
        accion={<Button onClick={() => navigate("/entreno/importar")}>Importar rutina</Button>}
      />
    );
  }

  return (
    <div className="space-y-3">
      <Card titulo="Esta semana">
        <p className="text-display tabular-nums text-accent">{entrenosEstaSemana}</p>
        <p className="text-caption mt-1 text-text-muted">
          entreno{entrenosEstaSemana === 1 ? "" : "s"} completado{entrenosEstaSemana === 1 ? "" : "s"}
        </p>
      </Card>

      <Card
        titulo={sesionActiva ? "Entreno en curso" : "Te toca"}
        accion={
          <span className="text-caption shrink-0 tabular-nums text-text-faint">
            día {proximo.indice + 1} de {proximo.total}
          </span>
        }
      >
        <p className="text-title mb-1">{proximo.dia.label}</p>
        <p className="text-caption mb-3 text-text-muted">
          {proximo.rutina.name} · semana {proximo.dia.week_number}
          {proximo.terminado ? " · mesociclo terminado" : ""}
        </p>

        <ul className="mb-4 space-y-1.5">
          {proximo.ejercicios.map((item) =>
            item.exercise ? (
              <li key={item.routineExercise.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/entreno/ejercicio/${item.exercise!.id}`)}
                  className="text-body flex w-full items-baseline justify-between gap-3 text-left active:opacity-70"
                >
                  <span className="truncate">{item.exercise.name}</span>
                  <span className="text-label shrink-0 tabular-nums text-text-muted">
                    {objetivoCorto(item.routineExercise)}
                  </span>
                </button>
              </li>
            ) : null,
          )}
        </ul>

        <Button onClick={() => navigate("/entreno/modo")}>
          {sesionActiva ? "Continuar entrenamiento" : "Iniciar entrenamiento"}
        </Button>
      </Card>

      {semana && <CalendarioSemana weekNumber={semana.weekNumber} dias={semana.dias} />}

      <Card titulo="Rutina">
        <p className="text-body mb-3 text-text-muted">{proximo.rutina.name}</p>
        <Button variant="secondary" className="w-full" onClick={() => navigate("/entreno/importar")}>
          Importar otra rutina
        </Button>
      </Card>
    </div>
  );
}
