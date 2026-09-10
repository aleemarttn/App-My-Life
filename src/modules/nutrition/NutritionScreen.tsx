import { EmptyState } from "@/core/ui/EmptyState";

/**
 * Portada del modulo nutricion. Placeholder de la fase 0.
 *
 * Es el ultimo modulo a proposito (D3): Nutrigasto tiene entrega de TFG en
 * octubre de 2026, y acoplar los dos proyectos ataria el trabajo academico a
 * los plazos de este. Se retoma despues de la entrega.
 */
export function NutritionScreen() {
  return (
    <EmptyState
      titulo="Aparcado hasta la fase 4"
      descripcion="Nutrición espera a que esté entregado el TFG de Nutrigasto. Son proyectos separados: se reutiliza código, no datos."
    />
  );
}
