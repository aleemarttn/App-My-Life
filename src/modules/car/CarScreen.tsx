import { EmptyState } from "@/core/ui/EmptyState";

/**
 * Portada del modulo coche. Placeholder de la fase 0.
 *
 * En la fase 2 aqui van: la ficha del vehiculo con el odometro, los
 * mantenimientos con su proyeccion (spec §6.4) y el consumo real calculado
 * de deposito lleno a deposito lleno (§6.2). Las tablas de este modulo
 * todavia no existen en la base de datos.
 */
export function CarScreen() {
  return (
    <EmptyState
      titulo="Sin vehículo"
      descripcion="La fase 2 traerá el odómetro, los mantenimientos con aviso por kilómetros o por fecha, y el consumo real en L/100 km."
    />
  );
}
