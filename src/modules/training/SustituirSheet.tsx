import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/core/db";
import { Button } from "@/core/ui/Button";

interface SustituirSheetProps {
  exerciseActualId: string;
  onSustituir: (nuevoExerciseId: string, motivo: string) => void;
  onCerrar: () => void;
}

function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * Buscador minimo del catalogo para sustituir un ejercicio a mitad de sesion
 * (spec §4.7: "abre el buscador del catalogo y registra el motivo"). Sin
 * `BottomSheet` propio todavia (design.md §6 lo deja para mas adelante):
 * misma superficie fija a pantalla completa que el cronometro de descanso.
 */
export function SustituirSheet({ exerciseActualId, onSustituir, onCerrar }: SustituirSheetProps) {
  const [busqueda, setBusqueda] = useState("");
  const [elegidoId, setElegidoId] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");

  const opciones = useLiveQuery(
    async () => {
      const catalogo = await db.exercises.filter((e) => e.deleted_at == null).sortBy("name");
      const texto = normalizar(busqueda);
      return catalogo.filter((e) => e.id !== exerciseActualId && (texto === "" || normalizar(e.name).includes(texto)));
    },
    [busqueda, exerciseActualId],
    [],
  );

  if (elegidoId) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-end bg-bg/80 backdrop-blur">
        <div className="rounded-t-sheet bg-surface p-4 pb-safe">
          <p className="text-title mb-1">Motivo de la sustitucion</p>
          <p className="text-label text-text-muted mb-3">Opcional, va al registro de la sesion.</p>
          <input
            autoFocus
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="máquina ocupada, molestia..."
            className="text-body mb-4 h-touch w-full rounded-button border border-border bg-surface-2 px-4 text-text placeholder:text-text-faint"
          />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setElegidoId(null)}>
              Atras
            </Button>
            <Button className="flex-1" onClick={() => onSustituir(elegidoId, motivo)}>
              Sustituir
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg">
      <div className="pt-safe flex items-center gap-3 border-b border-border p-4">
        <input
          autoFocus
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar ejercicio..."
          className="text-body h-touch flex-1 rounded-button border border-border bg-surface-2 px-4 text-text placeholder:text-text-faint"
        />
        <Button variant="ghost" onClick={onCerrar}>
          Cancelar
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 pb-safe">
        {opciones.length === 0 ? (
          <p className="text-body text-text-muted">Sin resultados.</p>
        ) : (
          <ul className="space-y-2">
            {opciones.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => setElegidoId(e.id)}
                  className="text-body h-touch w-full rounded-button bg-surface-2 px-4 text-left text-text active:bg-border"
                >
                  {e.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
