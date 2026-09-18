import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DotProps } from "recharts";

export interface PuntoMetricChart {
  /** ISO. Eje X. */
  fecha: string;
  valor: number;
  /** Sesion con etiqueta `molestia` (spec §4.9): punto rojo. */
  molestia?: boolean;
  /** El ejercicio de esta sesion vino de una sustitucion: punto hueco. */
  sustituido?: boolean;
}

interface MetricChartProps {
  puntos: PuntoMetricChart[];
  tipo?: "linea" | "barras";
  decimales?: number;
  /** design.md §9: el tonelaje y el volumen empiezan en cero; los pesos, no. */
  empezarEnCero?: boolean;
}

const FORMATO_FECHA = new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short" });

function formatearFecha(iso: string): string {
  return FORMATO_FECHA.format(new Date(iso));
}

function PuntoDestacado(props: DotProps & { payload?: PuntoMetricChart }) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null || !payload) return null;
  if (payload.molestia) {
    return <circle cx={cx} cy={cy} r={4} fill="var(--color-danger)" stroke="none" />;
  }
  if (payload.sustituido) {
    return <circle cx={cx} cy={cy} r={4} fill="var(--color-bg)" stroke="var(--color-text-muted)" strokeWidth={1.5} />;
  }
  return <circle cx={cx} cy={cy} r={3} fill="var(--color-accent)" stroke="none" />;
}

/**
 * Envoltorio unico de Recharts (design.md §6 y §9). Ningun modulo instancia
 * Recharts directamente: los ejes, colores y formatos se resuelven aqui una
 * sola vez. Se carga siempre detras de una ruta perezosa (nunca en el
 * arranque del modo entreno, spec §2.8).
 */
export function MetricChart({ puntos, tipo = "linea", decimales = 1, empezarEnCero = false }: MetricChartProps) {
  if (puntos.length === 0) {
    return (
      <div className="grid h-48 place-items-center rounded-button bg-surface-2">
        <p className="text-label text-text-faint">Todavía no hay registros suficientes.</p>
      </div>
    );
  }

  const formatearValor = (v: unknown) => Number(v).toFixed(decimales).replace(/\.0+$/, "");
  const dominio: [number | string, number | string] = empezarEnCero ? [0, "auto"] : ["auto", "auto"];
  const conPuntos = puntos.length < 30;

  const ejes = (
    <>
      <CartesianGrid vertical={false} stroke="var(--color-border)" strokeWidth={1} />
      <XAxis
        dataKey="fecha"
        tickFormatter={(v: unknown) => formatearFecha(String(v))}
        tick={{ fill: "var(--color-text-faint)", fontSize: 12 }}
        axisLine={{ stroke: "var(--color-border)" }}
        tickLine={false}
        minTickGap={40}
        interval="preserveStartEnd"
      />
      <YAxis
        domain={dominio}
        tick={{ fill: "var(--color-text-faint)", fontSize: 12 }}
        tickFormatter={(v: unknown) => formatearValor(v)}
        axisLine={false}
        tickLine={false}
        width={40}
      />
      <Tooltip
        labelFormatter={(v: unknown) => formatearFecha(String(v))}
        formatter={(v: unknown) => formatearValor(v)}
        contentStyle={{
          background: "var(--color-surface-2)",
          border: "1px solid var(--color-border)",
          borderRadius: 10,
          color: "var(--color-text)",
        }}
        labelStyle={{ color: "var(--color-text-muted)" }}
      />
    </>
  );

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        {tipo === "barras" ? (
          <BarChart data={puntos} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
            {ejes}
            <Bar dataKey="valor" fill="var(--color-accent)" radius={[3, 3, 0, 0]} maxBarSize={28} />
          </BarChart>
        ) : (
          <LineChart data={puntos} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
            {ejes}
            <Line
              dataKey="valor"
              stroke="var(--color-accent)"
              strokeWidth={2}
              dot={conPuntos ? <PuntoDestacado /> : false}
              activeDot={{ r: 5, fill: "var(--color-accent)" }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
