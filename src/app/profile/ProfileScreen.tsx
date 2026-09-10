import { Link } from "react-router";
import { Card } from "@/core/ui/Card";
import { useAuth } from "../auth/useAuth";
import { SyncPanel } from "../SyncPanel";
import { DatosCard } from "./DatosCard";

/**
 * Perfil: todo lo que ERES tu, no lo que haces (spec §5, D11).
 *
 * La estructura definitiva es Cuerpo · Salud · Objetivos · Ajustes · Datos.
 * En la fase 0 solo existe Datos; las demas quedan listadas con su fase para
 * que la jerarquia se vea desde el principio y no haya que rehacerla.
 */

const SECCIONES = [
  { titulo: "Cuerpo", detalle: "Peso, medidas, fotos y comparador", fase: "fase 1.5" },
  { titulo: "Salud", detalle: "Datos de Salud de iOS vía Atajos", fase: "fase 3" },
  { titulo: "Objetivos", detalle: "Peso objetivo, macros y RIR de referencia", fase: "fase 1.5" },
  { titulo: "Ajustes", detalle: "Cronómetro, unidades, tema y Telegram", fase: "fase 1" },
] as const;

export function ProfileScreen() {
  const { session } = useAuth();

  return (
    <div className="space-y-3">
      <Card titulo="Cuenta">
        <p className="text-body break-all text-accent">{session?.user.email}</p>
        <p className="text-caption mt-1 text-text-muted">Usuario único. Sin registro ni roles (D4).</p>
      </Card>

      <SyncPanel />

      <DatosCard />

      {SECCIONES.map((seccion) => (
        <Card
          key={seccion.titulo}
          titulo={seccion.titulo}
          accion={<span className="text-caption text-text-faint">{seccion.fase}</span>}
        >
          <p className="text-body text-text-muted">{seccion.detalle}</p>
        </Card>
      ))}

      <Link to="/perfil/diseno" className="block">
        <Card titulo="Sistema de diseño">
          <p className="text-body text-text-muted">
            Hoja de contraste de los tokens de <code className="text-accent">design.md</code>.
          </p>
          <p className="text-caption mt-1 text-text-faint">Provisional: se borra al cerrar la fase 0.</p>
        </Card>
      </Link>
    </div>
  );
}
