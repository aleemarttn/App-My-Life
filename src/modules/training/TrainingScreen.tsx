import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/core/db";
import { Card } from "@/core/ui/Card";
import { EmptyState } from "@/core/ui/EmptyState";

/**
 * Portada del modulo de entrenamiento. Placeholder de la fase 0.
 *
 * En la fase 1 aqui van: la sesion del dia, el acceso al modo entreno
 * (spec §4.7), el importador de Excel (§4.6) y las vistas globales de §4.9
 * —volumen semanal por grupo muscular, adherencia y molestias recurrentes—.
 */
export function TrainingScreen() {
  const catalogo = useLiveQuery(() => db.exercises.count(), [], 0);
  const sesiones = useLiveQuery(() => db.workout_sessions.count(), [], 0);

  if (sesiones === 0) {
    return (
      <div className="space-y-3">
        <EmptyState
          titulo="Todavia no hay rutina"
          descripcion="Cuando llegue la fase 1 podras importar el Excel del entrenador y empezar a registrar series."
        />
        <Card titulo="Catalogo de ejercicios">
          <p className="text-display tabular-nums text-accent">{catalogo}</p>
          <p className="text-caption mt-1 text-text-muted">
            ejercicios disponibles, sincronizados desde el servidor
          </p>
        </Card>
      </div>
    );
  }

  return (
    <Card titulo="Sesiones registradas">
      <p className="text-display tabular-nums">{sesiones}</p>
    </Card>
  );
}
