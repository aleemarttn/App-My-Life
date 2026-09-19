import { Chip } from "@/core/ui/Chip";

const TAGS: { valor: string; etiqueta: string }[] = [
  { valor: "facil", etiqueta: "fácil" },
  { valor: "al_fallo", etiqueta: "al fallo" },
  { valor: "molestia", etiqueta: "molestia" },
];

interface NotasSerieProps {
  tags: string[];
  onTags: (tags: string[]) => void;
  nota: string;
  onNota: (nota: string) => void;
  abierta: boolean;
  onAbrir: () => void;
}

/**
 * Las dos capas opcionales de comentario de una serie (spec §4.7): las
 * etiquetas rapidas y la nota libre para el entrenador. Opcionales de
 * verdad: registrar una serie no las necesita ni las pide.
 */
export function NotasSerie({ tags, onTags, nota, onNota, abierta, onAbrir }: NotasSerieProps) {
  function alternar(valor: string): void {
    onTags(tags.includes(valor) ? tags.filter((t) => t !== valor) : [...tags, valor]);
  }

  return (
    <>
      <div className="flex flex-wrap justify-center gap-2">
        {TAGS.map((t) => (
          <Chip key={t.valor} activo={tags.includes(t.valor)} onClick={() => alternar(t.valor)}>
            {t.etiqueta}
          </Chip>
        ))}
        {!abierta && (
          <button type="button" onClick={onAbrir} className="text-label h-touch px-3 text-text-muted">
            + nota
          </button>
        )}
      </div>

      {abierta && (
        <textarea
          autoFocus
          value={nota}
          onChange={(e) => onNota(e.target.value)}
          placeholder="Nota para tu entrenador..."
          rows={2}
          className="text-body w-full rounded-button border border-border bg-surface-2 px-4 py-3 text-text placeholder:text-text-faint"
        />
      )}
    </>
  );
}
