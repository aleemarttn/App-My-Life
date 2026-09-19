import { MaterialIcon } from "@/core/ui/MaterialIcon";

interface CopiarUltimaProps {
  peso: number | null;
  reps: number | null;
  onCopiar: () => void;
}

/**
 * "Copiar ultima sesion" en 1 tap (D28): lo que hiciste la ultima vez de
 * este mismo ejercicio, listo para repetirlo sin tocar los steppers. Es el
 * atajo que mas veces acierta, porque el 90% de las series repiten carga.
 */
export function CopiarUltima({ peso, reps, onCopiar }: CopiarUltimaProps) {
  return (
    <button
      type="button"
      onClick={onCopiar}
      className="flex w-full items-center gap-2 rounded-card border border-border bg-surface px-3 py-2.5 text-left active:bg-surface-2"
    >
      <MaterialIcon nombre="content_copy" tamano={18} className="shrink-0 text-text-muted" />
      <span className="text-label min-w-0 flex-1 truncate text-text">
        Copiar última sesión: {peso ?? "—"} kg × {reps ?? "—"} reps
      </span>
      <span className="text-label-sm shrink-0 rounded-chip bg-surface-2 px-2 py-1 font-mono uppercase tracking-wide text-accent">
        1-tap
      </span>
    </button>
  );
}
