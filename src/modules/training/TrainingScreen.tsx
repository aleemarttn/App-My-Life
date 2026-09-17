import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate } from "react-router";
import { db, usuarioActualId } from "@/core/db";
import { Button } from "@/core/ui/Button";
import { Card } from "@/core/ui/Card";
import { EmptyState } from "@/core/ui/EmptyState";
import { calcularProximoEntreno } from "./proximoEntreno";

/** Lunes a las 00:00 de la semana de `fecha` (semana ISO, no la del domingo). */
function inicioDeSemana(fecha: Date): Date {
  const d = new Date(fecha);
  const dia = d.getDay();
  d.setDate(d.getDate() + (dia === 0 ? -6 : 1 - dia));
  d.setHours(0, 0, 0, 0);
  return d;
}

function objetivoCorto(re: {
  target_sets: number | null;
  target_reps_min: number | null;
  target_reps_max: number | null;
  target_weight: number | null;
  target_duration_seconds: number | null;
  target_distance_m: number | null;
}): string {
  const partes: string[] = [];
  if (re.target_sets != null) partes.push(`${re.target_sets}×`);

  const min = re.target_reps_min;
  const max = re.target_reps_max;
  if (min != null || max != null) {
    partes.push(min != null && max != null && min !== max ? `${min}-${max}` : `${max ?? min}`);
  }
  if (re.target_weight != null) partes.push(`· ${re.target_weight} kg`);
  if (re.target_duration_seconds != null) partes.push(`· ${Math.round(re.target_duration_seconds / 60)} min`);
  if (re.target_distance_m != null) partes.push(`· ${re.target_distance_m / 1000} km`);

  return partes.join(" ");
}

/**
 * Portada del modulo de entrenamiento (pantalla 2 del wireframe, spec §7):
 * resumen de la semana y el entreno que toca, con el boton que lleva al
 * modo entreno (pantalla 3). Registrar una serie nunca deberia ser la
 * primera pantalla que se ve: primero se orienta, luego se actua
 * (design.md §1).
 *
 * Falta de la fase 1: el historial, el exportador y las vistas de §4.9
 * —volumen por grupo muscular, adherencia y molestias recurrentes—.
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
          {proximo.ejercicios.map((item) => (
            <li key={item.routineExercise.id} className="text-body flex items-baseline justify-between gap-3">
              <span className="truncate">{item.exercise?.name ?? "—"}</span>
              <span className="text-label shrink-0 tabular-nums text-text-muted">
                {objetivoCorto(item.routineExercise)}
              </span>
            </li>
          ))}
        </ul>

        <Button onClick={() => navigate("/entreno/modo")}>
          {sesionActiva ? "Continuar entrenamiento" : "Iniciar entrenamiento"}
        </Button>
      </Card>

      <Card titulo="Rutina">
        <p className="text-body mb-3 text-text-muted">{proximo.rutina.name}</p>
        <Button variant="secondary" className="w-full" onClick={() => navigate("/entreno/importar")}>
          Importar otra rutina
        </Button>
      </Card>
    </div>
  );
}
