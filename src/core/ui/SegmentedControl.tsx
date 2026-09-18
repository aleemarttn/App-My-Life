interface Opcion<T extends string> {
  id: T;
  etiqueta: string;
}

interface SegmentedControlProps<T extends string> {
  opciones: Opcion<T>[];
  valor: T;
  onCambiar: (valor: T) => void;
}

/**
 * Selector de rango temporal y de metrica en `DetailView` (design.md §6).
 * Genérico en `T` para servir tanto al rango (30 d / 90 d / 1 a / ⌂) como a
 * cualquier otra lista corta de opciones excluyentes.
 */
export function SegmentedControl<T extends string>({ opciones, valor, onCambiar }: SegmentedControlProps<T>) {
  return (
    <div className="flex gap-1 rounded-button bg-surface-2 p-1" role="tablist">
      {opciones.map((o) => (
        <button
          key={o.id}
          type="button"
          role="tab"
          aria-selected={valor === o.id}
          onClick={() => onCambiar(o.id)}
          className={
            "text-label h-touch flex-1 rounded-button px-2 transition-colors " +
            (valor === o.id ? "bg-accent text-on-accent" : "text-text-muted active:bg-border")
          }
        >
          {o.etiqueta}
        </button>
      ))}
    </div>
  );
}
