import { useState } from "react";
import { MaterialIcon } from "@/core/ui/MaterialIcon";
import { reloj } from "./formato";
import { useCronometro } from "./useCronometro";

interface HudSesionProps {
  /** `workout_sessions.started_at`, en ISO. */
  iniciadaEn: string;
  /** Sale a la pestana de Entreno DEJANDO la sesion viva (D31). */
  onSalir: () => void;
  /** Cierra la sesion de verdad: escribe `ended_at`. */
  onTerminar: () => void;
}

/**
 * Barra de estado del modo entreno (D28, ampliada por D31 con la salida).
 *
 * `Pausar` es solo visual y no persiste nada: el cronometro se lee siempre
 * de `started_at`, asi que cerrar la app y volver no pierde el tiempo real
 * de la sesion. Lo unico que escribe en la base es `Fin`.
 */
export function HudSesion({ iniciadaEn, onSalir, onTerminar }: HudSesionProps) {
  const [pausado, setPausado] = useState(false);
  const [confirmandoFin, setConfirmandoFin] = useState(false);
  const segundos = useCronometro(iniciadaEn, pausado);

  return (
    <div className="flex items-center gap-2 rounded-card border border-border bg-surface-2 px-2 py-1.5">
      <button
        type="button"
        onClick={onSalir}
        aria-label="Volver a Entreno sin terminar la sesión"
        className="size-touch grid shrink-0 place-items-center rounded-button text-text-muted active:bg-surface-3"
      >
        <MaterialIcon nombre="arrow_back" tamano={22} />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className={"size-2 shrink-0 rounded-chip bg-accent" + (pausado ? "" : " animate-pulse")} />
          <span className="text-label-sm truncate font-mono uppercase tracking-wide text-accent">
            {pausado ? "En pausa" : "En vivo"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <MaterialIcon nombre="timer" tamano={14} className="text-accent-2" />
          <span className="font-mono text-metric-md tabular-nums text-text">{reloj(segundos)}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setPausado((p) => !p)}
        className="text-label-sm flex h-10 shrink-0 items-center gap-1 rounded-button bg-surface-3 px-2.5 font-mono uppercase tracking-wide text-text active:bg-border"
      >
        <MaterialIcon nombre={pausado ? "play_arrow" : "pause"} tamano={14} />
        {pausado ? "Seguir" : "Pausar"}
      </button>
      <button
        type="button"
        onClick={() => (confirmandoFin ? onTerminar() : setConfirmandoFin(true))}
        className="text-label-sm flex h-10 shrink-0 items-center gap-1 rounded-button border border-danger/40 bg-danger/10 px-2.5 font-mono uppercase tracking-wide text-danger active:opacity-80"
      >
        <MaterialIcon nombre="stop" tamano={14} />
        {confirmandoFin ? "¿Seguro?" : "Fin"}
      </button>
    </div>
  );
}
