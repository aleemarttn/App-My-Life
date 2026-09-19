import { MaterialIcon } from "@/core/ui/MaterialIcon";

interface NotaEntrenadorProps {
  nota: string;
  className?: string;
}

/**
 * La nota que el entrenador escribio para este ejercicio en el Excel
 * (`routine_exercises.notes`).
 *
 * No es decoracion: ahi viven "Superset con A1", "AMRAP hasta el fallo
 * tecnico" y "si sube RIR a 4+ subimos 2,5 kg la semana que viene". Sin
 * esto, la pauta de la pantalla esta incompleta y hay que abrir el Excel
 * a mitad de sesion, que es exactamente lo que la app viene a evitar.
 */
export function NotaEntrenador({ nota, className = "" }: NotaEntrenadorProps) {
  return (
    <div
      className={`flex items-start gap-2 rounded-button border border-accent-3/30 bg-accent-3/5 px-3 py-2 ${className}`}
    >
      <MaterialIcon nombre="sticky_note_2" tamano={16} className="mt-0.5 shrink-0 text-accent-3" />
      <p className="text-label min-w-0 flex-1 text-text">{nota}</p>
    </div>
  );
}
