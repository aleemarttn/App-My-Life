import { useNavigate } from "react-router";
import { Card } from "@/core/ui/Card";
import { MaterialIcon } from "@/core/ui/MaterialIcon";
import { Pill } from "@/core/ui/Pill";
import type { DiaProgramado, EstadoDia } from "./proximoEntreno";
import { objetivoCorto } from "./formato";

const ETIQUETA_ESTADO: Record<EstadoDia, string> = { hecho: "Hecho", proximo: "Hoy toca", pendiente: "Pendiente" };
const COLOR_ESTADO: Record<EstadoDia, "accent" | "accent-3" | "neutral"> = {
  hecho: "accent",
  proximo: "accent-3",
  pendiente: "neutral",
};

function Marcador({ estado }: { estado: EstadoDia }) {
  if (estado === "hecho") {
    return <span className="text-label grid size-6 shrink-0 place-items-center rounded-full bg-accent text-on-accent">✓</span>;
  }
  if (estado === "proximo") {
    return <span className="size-6 shrink-0 rounded-full border-2 border-accent-3" />;
  }
  return <span className="size-6 shrink-0 rounded-full border-2 border-border" />;
}

interface CalendarioSemanaProps {
  weekNumber: number;
  dias: DiaProgramado[];
}

export function CalendarioSemana({ weekNumber, dias }: CalendarioSemanaProps) {
  const navigate = useNavigate();

  return (
    <Card titulo={`Semana ${weekNumber}`}>
      <ul className="-mx-4 divide-y divide-border">
        {dias.map(({ dia, ejercicios, estado }) => (
          <li key={dia.id} className="px-4 py-3">
            {/* El dia entero se abre (D35): hasta ahora solo se podia entrar
                a un ejercicio suelto, no a ver el dia completo. */}
            <button
              type="button"
              onClick={() => navigate(`/entreno/dia/${dia.id}`)}
              className="mb-2 flex w-full items-center gap-3 text-left active:opacity-70"
            >
              <Marcador estado={estado} />
              <p className="text-body min-w-0 flex-1 truncate">{dia.label}</p>
              <Pill color={COLOR_ESTADO[estado]}>{ETIQUETA_ESTADO[estado]}</Pill>
              <MaterialIcon nombre="chevron_right" tamano={18} className="shrink-0 text-text-faint" />
            </button>

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
