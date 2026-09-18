import { useNavigate, useParams } from "react-router";
import { DetailView } from "@/core/ui/DetailView";
import { MetricChart, type PuntoMetricChart } from "@/core/ui/MetricChart";
import { SegmentedControl } from "@/core/ui/SegmentedControl";
import { RANGOS } from "./metricas";
import { useHistorialEjercicio } from "./useHistorialEjercicio";

const ETIQUETA_RANGO: Record<string, string> = { "30d": "30 d", "90d": "90 d", "1a": "1 año", todo: "todo" };

/**
 * Pantalla 5 del wireframe (`design.md` §7): el `DetailView` (spec §2.8)
 * aplicado a un ejercicio. Se llega aqui pulsando el nombre de un ejercicio
 * desde la portada de Entreno; ruta perezosa para que Recharts nunca entre
 * en el arranque del modo entreno (spec §2.8, `CLAUDE.md`).
 */
export function DetalleEjercicioScreen() {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const navigate = useNavigate();
  const historial = useHistorialEjercicio(exerciseId ?? "");

  if (historial.cargando) return <div className="min-h-dvh bg-bg" />;

  if (!historial.ejercicio) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
        <p className="text-title">Ejercicio no encontrado</p>
        <button type="button" onClick={() => navigate("/entreno")} className="text-body text-accent">
          Volver a Entreno
        </button>
      </div>
    );
  }

  const puntosGrafico: PuntoMetricChart[] = historial.puntos.map((p) => ({
    fecha: p.fecha,
    valor: p.valor,
    molestia: p.molestia,
    sustituido: p.sustituido,
  }));

  const definicionActual = historial.metricas.find((m) => m.id === historial.metrica);

  return (
    <DetailView
      titulo={historial.ejercicio.name}
      onVolver={() => navigate(-1)}
      accionCabecera={
        historial.ejercicio.video_url && (
          <a
            href={historial.ejercicio.video_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Ver vídeo del ejercicio"
            className="size-touch grid shrink-0 place-items-center rounded-chip bg-surface-2 text-text-muted"
          >
            ▶
          </a>
        )
      }
      valor={historial.valorActual != null ? `${historial.valorActual}${historial.unidad ? ` ${historial.unidad}` : ""}` : "—"}
      valorEtiqueta={definicionActual?.etiqueta ?? ""}
      delta={
        historial.delta
          ? {
              texto: `${historial.delta.valor >= 0 ? "+" : ""}${historial.delta.valor.toFixed(1)} ${historial.unidad}`.trim(),
              positivo: historial.delta.positivo,
            }
          : null
      }
      deltaEtiqueta={historial.delta ? `últimos ${ETIQUETA_RANGO[historial.rango]}` : undefined}
      grafico={
        <MetricChart
          puntos={puntosGrafico}
          tipo={historial.metrica === "tonelaje" || historial.metrica === "reps_totales" ? "barras" : "linea"}
          empezarEnCero={historial.empezarEnCero}
        />
      }
      selectores={
        <>
          <SegmentedControl opciones={RANGOS} valor={historial.rango} onCambiar={historial.setRango} />
          {historial.metricas.length > 1 && (
            <SegmentedControl opciones={historial.metricas} valor={historial.metrica} onCambiar={historial.setMetrica} />
          )}
        </>
      }
      registros={historial.registrosLista}
    />
  );
}
