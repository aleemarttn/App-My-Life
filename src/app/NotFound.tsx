import { useNavigate } from "react-router";
import { Button } from "@/core/ui/Button";
import { EmptyState } from "@/core/ui/EmptyState";

export function NotFound() {
  const navegar = useNavigate();

  return (
    <EmptyState
      titulo="Esta pantalla no existe"
      descripcion="Puede que el enlace sea antiguo o que la seccion todavia no este construida."
      accion={<Button onClick={() => void navegar("/")}>Volver a Inicio</Button>}
    />
  );
}
