import type { ReactNode } from "react";

interface ListRowProps {
  titulo: string;
  subtitulo?: string;
  valor?: string;
  meta?: string;
  icono?: ReactNode;
  colorBarra?: "accent" | "accent-2" | "accent-3" | "danger" | "neutral";
  onClick?: () => void;
}

const COLORES_BARRA: Record<NonNullable<ListRowProps["colorBarra"]>, string> = {
  accent: "bg-accent",
  "accent-2": "bg-accent-2",
  "accent-3": "bg-accent-3",
  danger: "bg-danger",
  neutral: "bg-text-faint",
};

function Contenido({ titulo, subtitulo, valor, meta, icono, colorBarra }: Omit<ListRowProps, "onClick">) {
  return (
    <>
      {colorBarra && <span className={`h-10 w-1 shrink-0 rounded-chip ${COLORES_BARRA[colorBarra]}`} />}
      {icono && (
        <span className="grid size-9 shrink-0 place-items-center rounded-card bg-surface-2 text-accent">
          {icono}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-body truncate text-text">{titulo}</p>
        {subtitulo && <p className="text-caption truncate text-text-muted">{subtitulo}</p>}
      </div>
      {(valor || meta) && (
        <div className="flex shrink-0 flex-col items-end">
          {valor && <span className="text-body font-semibold tabular-nums text-text">{valor}</span>}
          {meta && <span className="text-caption text-text-muted">{meta}</span>}
        </div>
      )}
    </>
  );
}

export function ListRow(props: ListRowProps) {
  const clases = "flex w-full items-center gap-3 py-3 text-left";

  if (props.onClick) {
    return (
      <button type="button" onClick={props.onClick} className={`${clases} active:opacity-70`}>
        <Contenido {...props} />
      </button>
    );
  }

  return (
    <div className={clases}>
      <Contenido {...props} />
    </div>
  );
}