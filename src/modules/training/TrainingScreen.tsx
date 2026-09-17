import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate } from "react-router";
import { db, usuarioActualId } from "@/core/db";
import { Button } from "@/core/ui/Button";
import { Card } from "@/core/ui/Card";
import { EmptyState } from "@/core/ui/EmptyState";
import { construirPlanPrueba } from "./planEntrenoPrueba";

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
 * resumen de la semana y el proximo entreno, con el boton que lleva al modo
 * entreno (pantalla 3). Registrar una serie nunca deberia ser la primera
 * pantalla que se ve: primero se orienta, luego se actua (design.md §1).
 *
 * En la fase 1 falta todavia: el importador de Excel (§4.6) y las vistas
 * globales de §4.9 —volumen semanal por grupo muscular, adherencia y
 * molestias recurrentes—. El "proximo entreno" de aqui usa datos de PRUEBA
 * mientras no exista el importador: ver planEntrenoPrueba.ts.
 */
export function TrainingScreen() {
  const navigate = useNavigate();
  const userId = usuarioActualId();

  const catalogo = useLiveQuery(() => db.exercises.count(), [], 0);

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

  const proximoEntreno = useLiveQuery(() => construirPlanPrueba(), [], []);

  if (catalogo === 0) {
    return (
      <EmptyState
        titulo="Todavía no hay catálogo"
        descripcion="Conéctate a internet para sincronizar los ejercicios antes de poder entrenar."
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

      <Card titulo={sesionActiva ? "Entreno en curso" : "Próximo entreno"}>
        <ul className="mb-4 space-y-1.5">
          {proximoEntreno.map((item) => (
            <li key={item.exercise.id} className="text-body flex items-baseline justify-between gap-3">
              <span className="truncate">{item.exercise.name}</span>
              <span className="text-label shrink-0 tabular-nums text-text-muted">
                {item.planned.target_sets} × {item.planned.target_reps_max} · {item.planned.target_weight} kg
              </span>
            </li>
          ))}
        </ul>
        <Button onClick={() => navigate("/entreno/modo")}>
          {sesionActiva ? "Continuar entrenamiento" : "Iniciar entrenamiento"}
        </Button>
      </Card>

      <Card titulo="Catálogo de ejercicios">
        <p className="text-display tabular-nums text-accent">{catalogo}</p>
        <p className="text-caption mt-1 text-text-muted">ejercicios disponibles, sincronizados desde el servidor</p>
      </Card>
    </div>
  );
}
