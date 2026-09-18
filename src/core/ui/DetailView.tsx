import type { ReactNode } from "react";

export interface RegistroDetailView {
  id: string;
  /** "12 sep" */
  etiqueta: string;
  /** "4×8 · 100 kg · RIR 2" */
  valor: string;
  /** Sustitucion, serie saltada... se lee pero pesa menos visualmente. */
  atenuado?: boolean;
}

interface DetailViewProps {
  titulo: string;
  onVolver: () => void;
  /** Icono de video u otra accion secundaria de la cabecera. */
  accionCabecera?: ReactNode;
  valor: string;
  valorEtiqueta: string;
  delta?: { texto: string; positivo: boolean } | null;
  deltaEtiqueta?: string | undefined;
  grafico: ReactNode;
  /** Selectores de rango y metrica (`SegmentedControl`), entre el grafico y los registros. */
  selectores?: ReactNode;
  registros: RegistroDetailView[];
  registrosVacio?: string;
}

/**
 * Patron unico de vista de detalle (spec §2.8, D12): un ejercicio, tu peso,
 * una medida corporal, una categoria de gasto o el consumo del coche. Una
 * sola implementacion; cada modulo solo aporta que metricas ofrece, como se
 * calculan y como formatea sus registros — nunca una pantalla a medida
 * (`CLAUDE.md`, "toda entidad con historial usa el patron DetailView").
 */
export function DetailView({
  titulo,
  onVolver,
  accionCabecera,
  valor,
  valorEtiqueta,
  delta,
  deltaEtiqueta,
  grafico,
  selectores,
  registros,
  registrosVacio = "Todavía no hay registros.",
}: DetailViewProps) {
  return (
    <div className="min-h-dvh bg-bg px-4 pt-safe pb-8">
      <header className="flex items-center gap-3 py-4">
        <button
          type="button"
          onClick={onVolver}
          aria-label="Volver"
          className="text-title -ml-2 grid size-touch shrink-0 place-items-center text-text"
        >
          ←
        </button>
        <h1 className="text-title min-w-0 flex-1 truncate">{titulo}</h1>
        {accionCabecera}
      </header>

      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <p className="text-display tabular-nums text-text">{valor}</p>
          <p className="text-label text-text-muted">{valorEtiqueta}</p>
        </div>
        {delta && (
          <div className="text-right">
            <p className={"text-title tabular-nums " + (delta.positivo ? "text-accent" : "text-danger")}>
              {delta.positivo ? "▲" : "▼"} {delta.texto}
            </p>
            {deltaEtiqueta && <p className="text-caption text-text-muted">{deltaEtiqueta}</p>}
          </div>
        )}
      </div>

      <div className="mb-4 rounded-card border border-border bg-surface p-3">{grafico}</div>

      {selectores && <div className="mb-5 space-y-2">{selectores}</div>}

      <h2 className="text-label mb-2 text-text-muted">Registros</h2>
      {registros.length === 0 ? (
        <p className="text-body py-6 text-center text-text-faint">{registrosVacio}</p>
      ) : (
        <ul className="divide-y divide-border rounded-card border border-border bg-surface">
          {registros.map((r) => (
            <li
              key={r.id}
              className={
                "text-body flex items-baseline justify-between gap-3 px-4 py-3 " +
                (r.atenuado ? "text-text-faint" : "text-text")
              }
            >
              <span className="shrink-0 text-text-muted">{r.etiqueta}</span>
              <span className="truncate text-right tabular-nums">{r.valor}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
