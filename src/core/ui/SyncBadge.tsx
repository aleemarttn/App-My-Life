import { sincronizarAhora } from "@/core/db";
import { useSyncEstado } from "./useSyncEstado";

/**
 * Indicador discreto de registros sin subir (design.md §6).
 *
 * Discreto es la palabra clave: estar sin cobertura es normal, no es un
 * error. La app funciona igual y esto solo informa. Cuando no hay nada
 * pendiente no se pinta nada, para no añadir ruido permanente.
 */
export function SyncBadge() {
  const { pendientes, falladas, sincronizando } = useSyncEstado();

  if (pendientes === 0 && falladas === 0) return null;

  const hayProblema = falladas > 0;
  const texto = hayProblema
    ? `${falladas} sin subir`
    : sincronizando
      ? "Subiendo…"
      : `${pendientes} pendiente${pendientes === 1 ? "" : "s"}`;

  return (
    <button
      type="button"
      onClick={() => void sincronizarAhora()}
      aria-label={hayProblema ? "Registros rechazados. Reintentar" : "Registros pendientes de subir"}
      className={
        "text-caption inline-flex h-8 items-center gap-1.5 rounded-chip px-3 " +
        (hayProblema ? "bg-surface-2 text-danger" : "bg-surface-2 text-text-muted")
      }
    >
      <span
        aria-hidden
        className={
          "size-1.5 rounded-chip " +
          (hayProblema ? "bg-danger" : sincronizando ? "bg-info" : "bg-warning")
        }
      />
      {texto}
    </button>
  );
}
