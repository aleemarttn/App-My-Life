import { MaterialIcon } from "@/core/ui/MaterialIcon";
import type { DestinoTab } from "@/core/ui/TabBar";

export const DESTINOS: DestinoTab[] = [
  { to: "/", label: "Inicio", icono: <MaterialIcon nombre="home" /> },
  { to: "/entreno", label: "Entreno", icono: <MaterialIcon nombre="fitness_center" /> },
  { to: "/comida", label: "Comida", icono: <MaterialIcon nombre="restaurant" /> },
  { to: "/dinero", label: "Dinero", icono: <MaterialIcon nombre="account_balance_wallet" /> },
  { to: "/coche", label: "Coche", icono: <MaterialIcon nombre="directions_car" /> },
  { to: "/salud", label: "Salud", icono: <MaterialIcon nombre="favorite" /> },
];

const TITULOS: Record<string, string> = {
  "/": "My Life",
  "/entreno": "Entreno",
  "/entreno/importar": "Importar rutina",
  "/comida": "Comida",
  "/dinero": "Dinero",
  "/coche": "Coche",
  "/salud": "Salud",
  "/perfil": "Perfil",
  "/perfil/diseno": "Sistema de diseño",
};

export function tituloDe(ruta: string): string {
  return TITULOS[ruta] ?? "My Life";
}