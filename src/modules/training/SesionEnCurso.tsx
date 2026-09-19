import { useNavigate } from "react-router";
import { Button } from "@/core/ui/Button";
import { MaterialIcon } from "@/core/ui/MaterialIcon";
import { Pill } from "@/core/ui/Pill";
import { ProgressBar } from "@/core/ui/ProgressBar";
import { objetivoSesion, reloj } from "./formato";
import { SecuenciaSeries } from "./SecuenciaSeries";
import { useCronometro } from "./useCronometro";
import type { EjercicioEnCurso, SesionEnCurso as DatosSesionEnCurso } from "./useSesionEnCurso";

const COLOR_ESTADO: Record<EjercicioEnCurso["estado"], "accent" | "accent-3" | "neutral"> = {
  hecho: "accent",
  actual: "accent-3",
  pendiente: "neutral",
  saltado: "neutral",
};

const TEXTO_ESTADO: Record<EjercicioEnCurso["estado"], string> = {
  hecho: "Hecho",
  actual: "En curso",
  pendiente: "Pendiente",
  saltado: "Saltado",
};

function FilaEjercicio({ ejercicio, indice }: { ejercicio: EjercicioEnCurso; indice: number }) {
  const { estado, logs, totalSeries, exercise } = ejercicio;

  return (
    <li className="flex items-center gap-3 py-2.5">
      <span
        className={
          "text-label-md w-6 shrink-0 font-mono tabular-nums " +
          (estado === "actual" ? "text-accent-3" : estado === "hecho" ? "text-text-muted" : "text-text-faint")
        }
      >
        {indice}
      </span>
      <div className="min-w-0 flex-1">
        <p className={"text-body truncate " + (estado === "pendiente" ? "text-text-muted" : "text-text")}>
          {exercise?.name ?? "Ejercicio"}
        </p>
        <p className="text-caption truncate text-text-muted">{objetivoSesion(ejercicio.planned)}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className="text-label font-mono tabular-nums text-text">
          {logs.length}/{totalSeries}
        </span>
        <Pill color={COLOR_ESTADO[estado]}>{TEXTO_ESTADO[estado]}</Pill>
      </div>
    </li>
  );
}

interface SesionEnCursoProps {
  datos: DatosSesionEnCurso;
  onTerminar: () => void;
}

/**
 * La portada de Entreno cuando hay una sesion abierta (D31).
 *
 * Es la tercera pantalla del modulo: la que se ve al salir del modo entreno
 * con la flecha sin haberlo terminado. Aqui se MIRA como va la sesion -- la
 * secuencia de series del ejercicio en curso y el recorrido del dia
 * entero -- y se vuelve a entrar. No se registra nada: registrar es
 * exclusivo del modo entreno (spec §4.7).
 */
export function SesionEnCurso({ datos, onTerminar }: SesionEnCursoProps) {
  const navigate = useNavigate();
  const segundos = useCronometro(datos.sesion.started_at);
  const actual = datos.indiceActual >= 0 ? datos.ejercicios[datos.indiceActual] : undefined;

  return (
    <div className="space-y-3 pb-24">
      <section className="rounded-card border border-accent/30 bg-surface p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-1.5">
              <span className="size-2 animate-pulse rounded-chip bg-accent" />
              <span className="text-label-sm font-mono uppercase tracking-wide text-accent">En vivo</span>
            </div>
            <h2 className="text-title truncate">{datos.dia?.label ?? "Entreno en curso"}</h2>
          </div>
          <div className="shrink-0 text-right">
            <div className="flex items-center justify-end gap-1">
              <MaterialIcon nombre="timer" tamano={16} className="text-accent-2" />
              <span className="font-mono text-metric-md tabular-nums text-text">{reloj(segundos)}</span>
            </div>
            <p className="text-caption text-text-muted">en marcha</p>
          </div>
        </div>

        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <span className="text-label-md uppercase tracking-wide text-text-muted">Series registradas</span>
          <span className="text-label font-mono tabular-nums text-text">
            {datos.seriesRegistradas} de {datos.seriesPlanificadas}
          </span>
        </div>
        <ProgressBar
          porcentaje={
            datos.seriesPlanificadas > 0 ? (datos.seriesRegistradas / datos.seriesPlanificadas) * 100 : 0
          }
        />
      </section>

      {actual && (
        <section className="rounded-card border border-border bg-surface p-4">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-label-md uppercase tracking-wide text-text-muted">
                Ejercicio {datos.indiceActual + 1} de {datos.ejercicios.length}
              </p>
              <h2 className="text-title truncate">{actual.exercise?.name ?? "Ejercicio"}</h2>
            </div>
            <Pill color="accent-3">En curso</Pill>
          </div>
          <p className="text-caption mb-2 text-text-muted">{objetivoSesion(actual.planned)}</p>

          <SecuenciaSeries
            totalSeries={actual.totalSeries}
            objetivo={actual.planned}
            logs={actual.logs}
            numeroActual={actual.logs.length + 1}
          />
        </section>
      )}

      <section className="rounded-card border border-border bg-surface p-4">
        <h2 className="text-label-md mb-1 uppercase tracking-wide text-text-muted">Recorrido del día</h2>
        <ul className="divide-y divide-border">
          {datos.ejercicios.map((ejercicio, indice) => (
            <FilaEjercicio key={ejercicio.sessionExercise.id} ejercicio={ejercicio} indice={indice + 1} />
          ))}
        </ul>
        <Button variant="ghost" className="mt-2 w-full" onClick={onTerminar}>
          Terminar entreno
        </Button>
      </section>

      {/* Zona del pulgar (design.md §1), por encima de la barra de pestañas. */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-bg/95 px-4 pt-3 backdrop-blur pb-[calc(var(--spacing-tabbar)+env(safe-area-inset-bottom)+0.75rem)]">
        <Button onClick={() => navigate("/entreno/modo")}>Continuar entrenamiento</Button>
      </div>
    </div>
  );
}
