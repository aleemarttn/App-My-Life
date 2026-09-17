import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate } from "react-router";
import { db } from "@/core/db";
import { Button } from "@/core/ui/Button";
import { Card } from "@/core/ui/Card";
import { EmptyState } from "@/core/ui/EmptyState";

/**
 * Portada del modulo de entrenamiento.
 *
 * En la fase 1 falta todavia: el importador de Excel (§4.6) y las vistas
 * globales de §4.9 —volumen semanal por grupo muscular, adherencia y
 * molestias recurrentes—. El acceso al modo entreno (§4.7) usa datos de
 * prueba mientras no exista el importador: ver planEntrenoPrueba.ts.
 */
export function TrainingScreen() {
  const navigate = useNavigate();
  const catalogo = useLiveQuery(() => db.exercises.count(), [], 0);
  const sesiones = useLiveQuery(() => db.workout_sessions.count(), [], 0);

  return (
    <div className="space-y-3">
      <Card titulo="Modo entreno">
        <p className="text-body mb-3 text-text-muted">
          Prototipo con datos de prueba, para validar el flujo de registro en el gimnasio antes de
          construir el resto del módulo.
        </p>
        <Button onClick={() => navigate("/entreno/modo")}>Empezar</Button>
      </Card>

      {sesiones === 0 ? (
        <EmptyState
          titulo="Todavía no hay rutina"
          descripcion="Cuando llegue el importador de Excel podrás cargar la rutina del entrenador."
        />
      ) : (
        <Card titulo="Sesiones registradas">
          <p className="text-display tabular-nums">{sesiones}</p>
        </Card>
      )}

      <Card titulo="Catálogo de ejercicios">
        <p className="text-display tabular-nums text-accent">{catalogo}</p>
        <p className="text-caption mt-1 text-text-muted">ejercicios disponibles, sincronizados desde el servidor</p>
      </Card>
    </div>
  );
}
