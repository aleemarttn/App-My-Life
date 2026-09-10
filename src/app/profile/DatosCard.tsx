import { useState } from "react";
import { exportarTodo, nombreDeExportacion, vaciarBaseLocal } from "@/core/db";
import { supabase } from "@/core/supabase/client";
import { Button } from "@/core/ui/Button";
import { Card } from "@/core/ui/Card";

/**
 * Perfil → Datos (spec §5): exportar a JSON, vaciar la base local y cerrar
 * sesion.
 */
export function DatosCard() {
  const [confirmandoVaciado, setConfirmandoVaciado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  async function exportar() {
    const datos = await exportarTodo();
    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = nombreDeExportacion();
    enlace.click();
    URL.revokeObjectURL(url);

    const filas = Object.values(datos.tablas).reduce((suma, t) => suma + t.length, 0);
    setAviso(`Exportadas ${filas} filas y ${datos.outbox.length} pendientes.`);
  }

  async function vaciar() {
    if (!confirmandoVaciado) {
      setConfirmandoVaciado(true);
      return;
    }
    await vaciarBaseLocal();
    setConfirmandoVaciado(false);
    setAviso("Base local vaciada. Se volvera a bajar del servidor.");
  }

  return (
    <Card titulo="Datos">
      <p className="text-caption mb-4 text-text-muted">
        La copia incluye lo pendiente de subir, que es lo unico que no esta a salvo
        en el servidor.
      </p>

      <div className="space-y-2">
        <Button variant="secondary" className="w-full" onClick={() => void exportar()}>
          Exportar todo a JSON
        </Button>

        <Button
          variant={confirmandoVaciado ? "danger" : "ghost"}
          className="w-full"
          onClick={() => void vaciar()}
        >
          {confirmandoVaciado ? "Pulsa otra vez para confirmar" : "Vaciar base local"}
        </Button>

        {confirmandoVaciado && (
          <p className="text-caption text-danger">
            Se borra lo pendiente de subir. Exporta antes si te importa.
          </p>
        )}

        <Button variant="secondary" className="w-full" onClick={() => void supabase.auth.signOut()}>
          Cerrar sesion
        </Button>
      </div>

      {aviso && <p className="text-caption mt-3 text-accent">{aviso}</p>}
    </Card>
  );
}
