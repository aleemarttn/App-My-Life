import { EmptyState } from "@/core/ui/EmptyState";

// Portada del modulo Salud (D29): sale de Perfil y pasa a pestaña propia.
// Cubre lo que antes eran "Cuerpo" (peso, medidas, fotos, fase 1.5) y
// "Salud" (datos de Salud de iOS via Atajos, fase 3) juntos, porque el
// mockup de referencia los trata como una sola consulta de frecuencia
// diaria -- readiness, peso, sueño -- no semanal.
export function SaludScreen() {
  return (
    <EmptyState
      titulo="Sin datos todavía"
      descripcion="Peso, medidas, readiness y datos de Salud de iOS llegan en las fases 1.5 y 3."
    />
  );
}