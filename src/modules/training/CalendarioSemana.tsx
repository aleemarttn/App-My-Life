import { useNavigate } from "react-router";
import { Card } from "@/core/ui/Card";
import type { DiaProgramado, EstadoDia } from "./proximoEntreno";
import { objetivoCorto } from "./formato";

const ETIQUETA_ESTADO: Record<EstadoDia, string> = { hecho: "Hecho", proximo: "Hoy toca", pendiente: "Pendiente" };

function Marcador({ estado }: { estado: EstadoDia }) {
  if (estado === "hecho") {
    return <span className="text-label grid size-6 shrink-0 place-items-center rounded-full bg-accent text-on-accent">✓</span>;
  }
  if (estado === "proximo") {
    return <span className="size-6 shrink-0 rounded-full border-2 border-accent" />;
  }
  return <span className="size-6 shrink-0 rounded-full border-2 border-border" />;
}

interface CalendarioSemanaProps {
  weekNumber: number;
  dias: DiaProgramado[];
}

/**
 * "Calendario" de la semana en curso del mesociclo (spec §4.9 vistas
 * globales de la portada, D23): no son fechas reales —el mesociclo progresa
 * por secuencia, no por dia de la semana— sino los dias de esta semana
 * logica de la rutina, con lo que ya se hizo y lo que toca despues. Cada
 * ejercicio enlaza a su `DetailView` (spec §2.8).
 */
export function CalendarioSemana({ weekNumber, dias }: CalendarioSemanaProps) {
  const navigate = useNavigate();

  return (
    <Card titulo={`Semana ${weekNumber}`}>
      <ul className="-mx-4 divide-y divide-border">
        {dias.map(({ dia, ejercicios, estado }) => (
          <li key={dia.id} className="px-4 py-3">
            <div className="mb-2 flex items-center gap-3">
              <Marcador estado={estado} />
              <p className="text-body min-w-0 flex-1 truncate">{dia.label}</p>
              <span
                className={
                  "text-caption shrink-0 tabular-nums " +
                  (estado === "proximo" ? "text-accent" : "text-text-faint")
                }
              >
                {ETIQUETA_ESTADO[estado]}
              </span>
            </div>
            {ejercicios.length > 0 && (
              <ul className="space-y-1 pl-9">
                {ejercicios.map((item) =>
                  item.exercise ? (
                    <li key={item.routineExercise.id}>
                      <button
                        type="button"
                        onClick={() => navigate(`/entreno/ejercicio/${item.exercise!.id}`)}
                        className="text-label flex w-full items-baseline justify-between gap-3 py-1 text-left active:opacity-70"
                      >
                        <span className="truncate text-text-muted">{item.exercise.name}</span>
                        <span className="shrink-0 tabular-nums text-text-faint">
                          {objetivoCorto(item.routineExercise)}
                        </span>
                      </button>
                    </li>
                  ) : null,
                )}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
