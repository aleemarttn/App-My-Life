import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate } from "react-router";
import { usuarioActualId } from "@/core/db";
import { Button } from "@/core/ui/Button";
import { Card } from "@/core/ui/Card";
import { ListRow } from "@/core/ui/ListRow";
import { MaterialIcon } from "@/core/ui/MaterialIcon";
import { MetricTile } from "@/core/ui/MetricTile";
import { SectionHeader } from "@/core/ui/SectionHeader";
import { objetivoCorto } from "@/modules/training/formato";
import { calcularProximoEntreno } from "@/modules/training/proximoEntreno";
import { useEntrenosEstaSemana } from "@/modules/training/useEntrenosEstaSemana";

const OTROS_MODULOS = [
  { to: "/coche", titulo: "Coche", icono: "directions_car", fase: "fase 2" },
  { to: "/dinero", titulo: "Dinero", icono: "account_balance_wallet", fase: "fase 3" },
  { to: "/comida", titulo: "Comida", icono: "restaurant", fase: "fase 4" },
  { to: "/salud", titulo: "Salud", icono: "favorite", fase: "fase 1.5" },
] as const;

export function Dashboard() {
  const navigate = useNavigate();
  const userId = usuarioActualId();
  const proximo = useLiveQuery(async () => (userId ? await calcularProximoEntreno(userId) : null), [userId]);
  const entrenosEstaSemana = useEntrenosEstaSemana();

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-headline-lg">Inicio</h1>
        <p className="text-body text-text-muted">Lo que tienes hoy, sin tener que navegar.</p>
      </div>

      {proximo === undefined ? null : proximo === null ? (
        <Card titulo="Entreno">
          <p className="text-body mb-3 text-text-muted">Todavía no hay rutina importada.</p>
          <Button onClick={() => navigate("/entreno/importar")}>Importar rutina</Button>
        </Card>
      ) : (
        <Card
          titulo="Te toca"
          accion={
            <span className="text-caption shrink-0 tabular-nums text-text-faint">
              día {proximo.indice + 1} de {proximo.total}
            </span>
          }
        >
          <p className="text-title mb-3">{proximo.dia.label}</p>

          <div className="mb-3 grid grid-cols-2 gap-2">
            <MetricTile
              etiqueta="Esta semana"
              valor={entrenosEstaSemana}
              unidad={entrenosEstaSemana === 1 ? "entreno" : "entrenos"}
              icono={<MaterialIcon nombre="check_circle" tamano={16} />}
            />
            <MetricTile
              etiqueta="Semana del plan"
              valor={proximo.dia.week_number}
              icono={<MaterialIcon nombre="calendar_month" tamano={16} />}
            />
          </div>

          <ul className="mb-4 space-y-1.5">
            {proximo.ejercicios.slice(0, 3).map((item) =>
              item.exercise ? (
                <li key={item.routineExercise.id} className="text-label flex items-baseline justify-between gap-3">
                  <span className="truncate text-text-muted">{item.exercise.name}</span>
                  <span className="shrink-0 tabular-nums text-text-faint">{objetivoCorto(item.routineExercise)}</span>
                </li>
              ) : null,
            )}
          </ul>

          <Button onClick={() => navigate("/entreno")}>Ir a Entreno</Button>
        </Card>
      )}

      <div>
        <SectionHeader titulo="Otros módulos" className="mb-2" />
        <Card>
          <div className="-my-1.5 divide-y divide-border">
            {OTROS_MODULOS.map((modulo) => (
              <ListRow
                key={modulo.to}
                titulo={modulo.titulo}
                subtitulo="Sin datos todavía"
                meta={modulo.fase}
                icono={<MaterialIcon nombre={modulo.icono} tamano={18} />}
                onClick={() => navigate(modulo.to)}
              />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
