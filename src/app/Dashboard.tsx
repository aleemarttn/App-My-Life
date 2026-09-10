import { Link } from "react-router";
import { Card } from "@/core/ui/Card";

/**
 * Inicio: "¿que tengo hoy?" sin obligar a navegar (D7, spec §2.7).
 *
 * ESQUELETO de la fase 0. Las tarjetas son las definitivas y estan en su
 * orden definitivo; lo que falta son los datos, que llegan con cada modulo.
 * Se monta asi a proposito: cambiar la maqueta despues cuesta mas que dejar
 * el hueco hecho ahora.
 */

const TARJETAS = [
  {
    to: "/entreno",
    titulo: "Entreno de hoy",
    vacio: "Sin rutina activa",
    detalle: "Importa el Excel del entrenador para empezar.",
    fase: "fase 1",
  },
  {
    to: "/coche",
    titulo: "Coche",
    vacio: "Sin vehículo",
    detalle: "Próximo mantenimiento y kilómetros pendientes.",
    fase: "fase 2",
  },
  {
    to: "/dinero",
    titulo: "Gasto del mes",
    vacio: "Sin presupuesto",
    detalle: "Acumulado del mes frente a lo presupuestado.",
    fase: "fase 3",
  },
  {
    to: "/perfil",
    titulo: "Peso",
    vacio: "Sin registros",
    detalle: "Media móvil de 7 días y tendencia a 30 (D14).",
    fase: "fase 1.5",
  },
  {
    to: "/comida",
    titulo: "Macros de hoy",
    vacio: "Sin objetivo",
    detalle: "Llega después de la entrega del TFG (D3).",
    fase: "fase 4",
  },
] as const;

export function Dashboard() {
  return (
    <div className="space-y-3">
      {TARJETAS.map((tarjeta) => (
        <Link key={tarjeta.titulo} to={tarjeta.to} className="block">
          <Card
            titulo={tarjeta.titulo}
            accion={<span className="text-caption text-text-faint">{tarjeta.fase}</span>}
          >
            <p className="text-body text-text-muted">{tarjeta.vacio}</p>
            <p className="text-caption mt-1 text-text-faint">{tarjeta.detalle}</p>
          </Card>
        </Link>
      ))}
    </div>
  );
}
