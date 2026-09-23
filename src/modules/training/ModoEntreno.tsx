import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/core/ui/Button";
import { EmptyState } from "@/core/ui/EmptyState";
import { RestTimer } from "./RestTimer";
import { SerieActiva } from "./SerieActiva";
import { useAutoDescanso } from "./useAutoDescanso";
import { useSesionEntreno } from "./useSesionEntreno";
import { useWakeLock } from "./useWakeLock";

interface Descanso {
  clave: string;
  segundos: number;
}

export function ModoEntreno() {
  const navigate = useNavigate();
  const sesion = useSesionEntreno();
  const [descanso, setDescanso] = useState<Descanso | null>(null);
  // El toggle de auto-inicio salio de la pantalla (D39): siempre se abre el
  // descanso al confirmar. `useAutoDescanso` se queda solo en `localStorage`
  // por si algun dia vuelve a exponerse desde Ajustes (D33).
  const [autoDescanso] = useAutoDescanso();

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
  const sesionRow = sesion.sesion;
  if (!paso || !sesionRow) return null;

  return (
    <SerieActiva
      key={`${paso.sessionExercise.id}-${paso.numeroSerie}`}
      paso={paso}
      sesion={sesionRow}
      onConfirmar={(entrada) => {
        void sesion.confirmarSerie(entrada);
        if (!autoDescanso) return;
        setDescanso({
          clave: `${paso.sessionExercise.id}-${paso.numeroSerie}`,
          segundos: paso.descansoSegundos,
        });
      }}
      /* Salir NO cierra la sesion: sigue viva y la portada de Entreno la
         enseña en curso (D31), donde tambien esta "Terminar entreno" (D39:
         terminar a medias ya no es posible desde dentro de la serie). */
      onSalir={() => navigate("/entreno")}
    />
  );
}
