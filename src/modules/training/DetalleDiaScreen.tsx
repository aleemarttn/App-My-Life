import { useNavigate, useParams } from "react-router";
import { Button } from "@/core/ui/Button";
import { EmptyState } from "@/core/ui/EmptyState";
import { MaterialIcon } from "@/core/ui/MaterialIcon";
import { Pill } from "@/core/ui/Pill";
import { objetivoSesion, reloj } from "./formato";
import { NotaEntrenador } from "./NotaEntrenador";
import { SesionRegistrada } from "./SesionRegistrada";
import { useDetalleDia } from "./useDetalleDia";

/**
 * Un dia de la rutina, de solo lectura (D35): lo que toca hacer y lo que se
 * hizo las veces que se hizo.
 *
 * Pantalla "empujada" con su propia flecha de volver, como el detalle de
 * ejercicio (D24): no lleva barra de pestanas debajo.
 */
export function DetalleDiaScreen() {
  const { diaId } = useParams();
  const navigate = useNavigate();
  const detalle = useDetalleDia(diaId);

  if (detalle === undefined) return <div className="min-h-dvh bg-bg" />;

  if (detalle === null) {
    return (
      <div className="min-h-dvh bg-bg px-4 pt-safe">
        <EmptyState
          titulo="Ese día ya no existe"
          descripcion="Puede que hayas importado otra rutina desde entonces."
          accion={<Button onClick={() => navigate("/entreno")}>Volver a Entreno</Button>}
        />
      </div>
    );
  }

  const { dia, rutina, ejercicios, sesiones } = detalle;

  return (
    <div className="min-h-dvh bg-bg pb-10 pt-safe">
      <header className="flex items-center gap-2 px-2 py-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Volver"
          className="size-touch grid shrink-0 place-items-center rounded-button text-text-muted active:bg-surface-2"
        >
          <MaterialIcon nombre="arrow_back" tamano={22} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-title truncate">{dia.label}</h1>
          <p className="text-caption truncate text-text-muted">
            {rutina?.name ?? "Rutina"} · semana {dia.week_number}
          </p>
        </div>
        {detalle.enCurso && <Pill color="accent-3">En curso</Pill>}
      </header>

      <div className="space-y-3 px-4">
        <section className="rounded-card border border-border bg-surface p-4">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <h2 className="text-label-md uppercase tracking-wide text-text-muted">Lo que toca</h2>
            <span className="text-label-md font-mono tabular-nums text-text-muted">
              {ejercicios.length} ejercicios
            </span>
          </div>

          <ul className="divide-y divide-border">
            {ejercicios.map((item, indice) => (
              <li key={item.routineExercise.id} className="py-2.5">
                <button
                  type="button"
                  disabled={!item.exercise}
                  onClick={() => item.exercise && navigate(`/entreno/ejercicio/${item.exercise.id}`)}
                  className="flex w-full items-center gap-3 text-left active:opacity-70"
                >
                  <span className="text-label-md w-6 shrink-0 font-mono tabular-nums text-text-faint">
                    {indice + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-body truncate text-text">
                      {item.exercise?.name ?? "Ejercicio sin catálogo"}
                    </p>
                    <p className="text-caption truncate tabular-nums text-text-muted">
                      {objetivoSesion(item.routineExercise)}
                    </p>
                  </div>
                  {item.routineExercise.rest_seconds != null && (
                    <span className="text-caption flex shrink-0 items-center gap-1 font-mono tabular-nums text-text-muted">
                      <MaterialIcon nombre="schedule" tamano={14} />
                      {reloj(item.routineExercise.rest_seconds)}
                    </span>
                  )}
                </button>
                {item.routineExercise.notes && (
                  <NotaEntrenador nota={item.routineExercise.notes} className="ml-9 mt-1.5" />
                )}
              </li>
            ))}
          </ul>
        </section>

        {sesiones.length === 0 ? (
          <section className="rounded-card border border-border bg-surface p-4">
            <h2 className="text-label-md mb-1 uppercase tracking-wide text-text-muted">Lo que hiciste</h2>
            <p className="text-body text-text-muted">Este día todavía no lo has entrenado.</p>
          </section>
        ) : (
          sesiones.map((sesion) => <SesionRegistrada key={sesion.sesion.id} sesion={sesion} />)
        )}
      </div>
    </div>
  );
}
