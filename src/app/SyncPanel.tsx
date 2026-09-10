import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { crear, db, sincronizarAhora, uuidv7 } from "@/core/db";
import { Button } from "@/core/ui/Button";
import { useSyncEstado } from "@/core/ui/useSyncEstado";

/**
 * PROVISIONAL. Existe para poder ejecutar a mano la prueba de aceptacion
 * de la fase 0 (docs/estado.md, punto 11): crear un registro en modo avion,
 * cerrar la app, recuperar la red y comprobar que llega a Supabase.
 *
 * Desaparece cuando el modulo de entrenamiento tenga pantallas reales que
 * escriban de verdad.
 */
export function SyncPanel() {
  const estado = useSyncEstado();
  const [ultimo, setUltimo] = useState<string | null>(null);

  // useLiveQuery vuelve a consultar solo cuando Dexie cambia. Es el patron
  // que usaran todas las pantallas: la interfaz lee de Dexie y nunca espera
  // a la red para pintar (spec §2.3).
  const locales = useLiveQuery(() => db.exercises.count(), [], 0);

  async function crearPrueba() {
    const nombre = `Prueba ${new Date().toLocaleTimeString("es-ES")}`;
    await crear("exercises", { name: nombre, kind: "other", notes: `origen: ${uuidv7()}` });
    setUltimo(nombre);
  }

  return (
    <section className="rounded-card border border-border bg-surface p-4">
      <h2 className="text-title mb-1">Sincronizacion</h2>
      <p className="text-caption mb-4 text-text-muted">
        Modo avion → crear → cerrar la app → volver la red → comprobar Supabase.
      </p>

      <dl className="text-body mb-4 grid grid-cols-2 gap-y-2">
        <dt className="text-text-muted">En Dexie</dt>
        <dd className="tabular-nums text-right">{locales}</dd>

        <dt className="text-text-muted">Pendientes</dt>
        <dd className="tabular-nums text-right text-warning">{estado.pendientes}</dd>

        <dt className="text-text-muted">Rechazados</dt>
        <dd className="tabular-nums text-right text-danger">{estado.falladas}</dd>

        <dt className="text-text-muted">Estado</dt>
        <dd className="text-right">
          {estado.sincronizando ? (
            <span className="text-info">sincronizando…</span>
          ) : estado.ultimoError ? (
            <span className="text-danger">sin conexion</span>
          ) : (
            <span className="text-accent">al dia</span>
          )}
        </dd>
      </dl>

      {ultimo && (
        <p className="text-caption mb-3 text-text-faint">Ultimo creado: {ultimo}</p>
      )}

      <div className="space-y-2">
        <Button onClick={() => void crearPrueba()}>Crear ejercicio de prueba</Button>
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => void sincronizarAhora()}
          disabled={estado.sincronizando}
        >
          Sincronizar ahora
        </Button>
      </div>
    </section>
  );
}
