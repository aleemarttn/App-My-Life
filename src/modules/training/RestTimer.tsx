import { useEffect, useState } from "react";
import { Button } from "@/core/ui/Button";

interface RestTimerProps {
  /** Cambia (id) para reiniciar la cuenta atras al empezar un descanso nuevo. */
  clave: string;
  segundos: number;
  onTerminar: () => void;
}

/**
 * Cronometro de descanso a pantalla completa, con aviso haptico (spec §4.7).
 * Activable/desactivable en ajustes queda pendiente (asuncion 3, sin pantalla
 * de ajustes todavia): por ahora siempre esta encendido.
 */
export function RestTimer({ clave, segundos, onTerminar }: RestTimerProps) {
  const [restante, setRestante] = useState(segundos);

  useEffect(() => {
    setRestante(segundos);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reinicia solo al cambiar de descanso, no de duracion
  }, [clave]);

  useEffect(() => {
    if (restante <= 0) {
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      return;
    }
    const id = setTimeout(() => setRestante((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [restante]);

  const mm = Math.floor(Math.max(restante, 0) / 60)
    .toString()
    .padStart(2, "0");
  const ss = (Math.max(restante, 0) % 60).toString().padStart(2, "0");

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-bg px-6">
      <p className="text-label text-text-muted">Descanso</p>
      <p className="text-display tabular-nums">
        {mm}:{ss}
      </p>
      <Button variant="secondary" onClick={onTerminar} className="max-w-xs">
        {restante <= 0 ? "Siguiente serie" : "Saltar descanso"}
      </Button>
    </div>
  );
}
