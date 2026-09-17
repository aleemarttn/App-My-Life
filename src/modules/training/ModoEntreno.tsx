import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/core/ui/Button";
import { EmptyState } from "@/core/ui/EmptyState";
import { RestTimer } from "./RestTimer";
import { SerieActiva } from "./SerieActiva";
import { useSesionEntreno } from "./useSesionEntreno";
import { useWakeLock } from "./useWakeLock";

interface Descanso {
  clave: string;
  segundos: number;
}

/** Si la rutina no pauta descanso, dos minutos es lo habitual en fuerza. */
const DESCANSO_POR_DEFECTO = 120;

/**
 * Pantalla 3 del wireframe (spec §4.7): "la pantalla que decide el
 * proyecto". Fuera de `AppShell` a proposito: secuencial y bloqueante, sin
 * barra de pestañas que distraiga ni tiente a salir a mitad de serie.
 */
export function ModoEntreno() {
  const navigate = useNavigate();
  const sesion = useSesionEntreno();
  const [descanso, setDescanso] = useState<Descanso | null>(null);

  useWakeLock(!sesion.completada);

  if (sesion.cargando) {
    return <div className="min-h-dvh bg-bg" />;
  }

  if (sesion.sinRutina) {
    return (
      <div className="min-h-dvh bg-bg px-4 pt-safe">
        <EmptyState
          titulo="No hay rutina activa"
          descripcion="Importa el Excel de tu entrenador para tener algo que entrenar."
          accion={<Button onClick={() => navigate("/entreno/importar")}>Importar rutina</Button>}
        />
      </div>
    );
  }

  if (sesion.completada) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-bg px-6 text-center">
        <p className="text-title-lg">Sesión completada</p>
        <p className="text-body text-text-muted">{sesion.seriesRegistradas} series registradas.</p>
        <Button className="max-w-xs" onClick={() => navigate("/entreno")}>
          Volver a Entreno
        </Button>
      </div>
    );
  }

  if (descanso) {
    return <RestTimer clave={descanso.clave} segundos={descanso.segundos} onTerminar={() => setDescanso(null)} />;
  }

  const paso = sesion.paso;
  if (!paso) return null; // inalcanzable: cubierto por los casos de arriba

  return (
    <SerieActiva
      key={`${paso.sessionExercise.id}-${paso.numeroSerie}`}
      paso={paso}
      onConfirmar={(entrada) => {
        void sesion.confirmarSerie(entrada);
        setDescanso({
          clave: `${paso.sessionExercise.id}-${paso.numeroSerie}`,
          segundos: paso.planned.rest_seconds ?? DESCANSO_POR_DEFECTO,
        });
      }}
      onSaltar={() => void sesion.saltarEjercicio()}
      onSustituir={(nuevoId, motivo) => void sesion.sustituirEjercicio(nuevoId, motivo)}
    />
  );
}
