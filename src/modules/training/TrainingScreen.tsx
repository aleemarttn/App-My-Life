import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate } from "react-router";
import { db, usuarioActualId } from "@/core/db";
import { Button } from "@/core/ui/Button";
import { Card } from "@/core/ui/Card";
import { EmptyState } from "@/core/ui/EmptyState";
import { ListRow } from "@/core/ui/ListRow";
import { MaterialIcon } from "@/core/ui/MaterialIcon";
import { MetricTile } from "@/core/ui/MetricTile";
import { CalendarioSemana } from "./CalendarioSemana";
import { exportarRutinaActiva } from "./exportarRutina";
import { objetivoCorto } from "./formato";
import { calcularProximoEntreno, calcularSemanaActual } from "./proximoEntreno";
import { useEntrenosEstaSemana } from "./useEntrenosEstaSemana";

export function TrainingScreen() {
  const navigate = useNavigate();
  const userId = usuarioActualId();
  const [exportando, setExportando] = useState(false);
  const [avisoExportacion, setAvisoExportacion] = useState<string | null>(null);

  async function exportar() {
    setExportando(true);
    setAvisoExportacion(null);
    try {
      const resultado = await exportarRutinaActiva();
      if (!resultado) {
        setAvisoExportacion("Todavía no hay ninguna sesión completada de esta rutina.");
        return;
      }

      const url = URL.createObjectURL(resultado.blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = resultado.nombreArchivo;
      enlace.click();
      URL.revokeObjectURL(url);

      setAvisoExportacion(`Exportadas ${resultado.filas} series de ${resultado.semanas} semana${resultado.semanas === 1 ? "" : "s"}.`);
    } finally {
      setExportando(false);
    }
  }

  const entrenosEstaSemana = useEntrenosEstaSemana();

  const sesionActiva = useLiveQuery(
    async () => {
      if (!userId) return undefined;
      const sesiones = await db.workout_sessions
        .where("user_id")
        .equals(userId)
        .filter((s) => s.ended_at == null && s.deleted_at == null)
        .toArray();
      return sesiones.at(-1);
    },
    [userId],
    undefined,
  );

  const proximo = useLiveQuery(async () => (userId ? await calcularProximoEntreno(userId) : null), [userId]);
  const semana = useLiveQuery(async () => (userId ? await calcularSemanaActual(userId) : null), [userId]);

  if (proximo === undefined) return null;

  if (proximo === null) {
    return (
      <EmptyState
        titulo="Todavía no hay rutina"
        descripcion="Importa el Excel de tu entrenador y la app se encarga del resto."
        accion={<Button onClick={() => navigate("/entreno/importar")}>Importar rutina</Button>}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
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

      <Card
        titulo={sesionActiva ? "Entreno en curso" : "Te toca"}
        accion={
          <span className="text-caption shrink-0 tabular-nums text-text-faint">
            día {proximo.indice + 1} de {proximo.total}
          </span>
        }
      >
        <p className="text-title mb-1">{proximo.dia.label}</p>
        <p className="text-caption mb-3 text-text-muted">
          {proximo.rutina.name} · semana {proximo.dia.week_number}
          {proximo.terminado ? " · mesociclo terminado" : ""}
        </p>

        <div className="-my-1.5 mb-2 divide-y divide-border">
          {proximo.ejercicios.map((item) =>
            item.exercise ? (
              <ListRow
                key={item.routineExercise.id}
                titulo={item.exercise.name}
                valor={objetivoCorto(item.routineExercise)}
                onClick={() => navigate(`/entreno/ejercicio/${item.exercise!.id}`)}
              />
            ) : null,
          )}
        </div>

        <Button onClick={() => navigate("/entreno/modo")}>
          {sesionActiva ? "Continuar entrenamiento" : "Iniciar entrenamiento"}
        </Button>
      </Card>

      {semana && <CalendarioSemana weekNumber={semana.weekNumber} dias={semana.dias} />}

      <Card titulo="Rutina">
        <p className="text-body mb-3 text-text-muted">{proximo.rutina.name}</p>
        <div className="space-y-2">
          <Button variant="secondary" className="w-full" onClick={() => navigate("/entreno/importar")}>
            Importar otra rutina
          </Button>
          <Button variant="secondary" className="w-full" disabled={exportando} onClick={() => void exportar()}>
            {exportando ? "Exportando..." : "Exportar a Excel"}
          </Button>
        </div>
        {avisoExportacion && <p className="text-caption mt-3 text-text-muted">{avisoExportacion}</p>}
      </Card>
    </div>
  );
}
