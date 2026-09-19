import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate } from "react-router";
import { actualizar, usuarioActualId } from "@/core/db";
import { Button } from "@/core/ui/Button";
import { Card } from "@/core/ui/Card";
import { EmptyState } from "@/core/ui/EmptyState";
import { MaterialIcon } from "@/core/ui/MaterialIcon";
import { MetricTile } from "@/core/ui/MetricTile";
import { CalendarioSemana } from "./CalendarioSemana";
import { exportarRutinaActiva } from "./exportarRutina";
import { calcularProximoEntreno, calcularSemanaActual } from "./proximoEntreno";
import { ResumenDia } from "./ResumenDia";
import { SesionEnCurso } from "./SesionEnCurso";
import { useEntrenosEstaSemana } from "./useEntrenosEstaSemana";
import { useSesionEnCurso } from "./useSesionEnCurso";

/**
 * Portada de Entreno. Tiene dos caras (D31): el resumen del dia que toca
 * cuando no hay nada empezado, y el estado de la sesion cuando la hay --
 * que es lo que se ve al salir del modo entreno con la flecha sin haberlo
 * terminado.
 */
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

      setAvisoExportacion(
        `Exportadas ${resultado.filas} series de ${resultado.semanas} semana${resultado.semanas === 1 ? "" : "s"}.`,
      );
    } finally {
      setExportando(false);
    }
  }

  const entrenosEstaSemana = useEntrenosEstaSemana();
  const enCurso = useSesionEnCurso();

  const proximo = useLiveQuery(async () => (userId ? await calcularProximoEntreno(userId) : null), [userId]);
  const semana = useLiveQuery(async () => (userId ? await calcularSemanaActual(userId) : null), [userId]);

  if (proximo === undefined || enCurso === undefined) return null;

  if (proximo === null) {
    return (
      <EmptyState
        titulo="Todavía no hay rutina"
        descripcion="Importa el Excel de tu entrenador y la app se encarga del resto."
        accion={<Button onClick={() => navigate("/entreno/importar")}>Importar rutina</Button>}
      />
    );
  }

  if (enCurso) {
    return (
      <SesionEnCurso
        datos={enCurso}
        onTerminar={() =>
          void actualizar("workout_sessions", enCurso.sesion.id, { ended_at: new Date().toISOString() })
        }
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

      <ResumenDia proximo={proximo} />

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
