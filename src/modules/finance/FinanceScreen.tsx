import { EmptyState } from "@/core/ui/EmptyState";

/**
 * Portada del modulo economia. Placeholder de la fase 0.
 *
 * En la fase 3 aqui van: los gastos capturados por `parse-entry` (spec §2.5)
 * desde Telegram o desde la propia app, los presupuestos por categoria con
 * alerta de desvio, y el enlace con repostajes y mantenimientos del coche.
 * El criterio de salida de esa fase es poder apagar el bot antiguo.
 */
export function FinanceScreen() {
  return (
    <EmptyState
      titulo="Sin gastos todavia"
      descripcion="La fase 3 traera la captura por Telegram, los presupuestos por categoria y la migracion del historico del bot actual."
    />
  );
}
