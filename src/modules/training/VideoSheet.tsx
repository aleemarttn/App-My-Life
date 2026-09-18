import { BottomSheet } from "@/core/ui/BottomSheet";

interface VideoSheetProps {
  videoUrl: string;
  titulo: string;
  onCerrar: () => void;
}

/**
 * Id de video a partir de las formas habituales de enlace de YouTube
 * (`youtu.be/ID`, `youtube.com/watch?v=ID`, `/shorts/ID`, `/embed/ID`).
 * `spec.md` §4.2 solo promete "enlace de YouTube", no un formato unico.
 */
function idDeYoutube(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }

  if (u.hostname === "youtu.be") return u.pathname.slice(1) || null;

  if (u.hostname === "youtube.com" || u.hostname.endsWith(".youtube.com")) {
    if (u.pathname === "/watch") return u.searchParams.get("v");
    const coincidencia = /^\/(shorts|embed)\/([^/]+)/.exec(u.pathname);
    if (coincidencia) return coincidencia[2] ?? null;
  }

  return null;
}

/**
 * Vídeo del ejercicio en hoja inferior (spec §4.5): "no se reproduce
 * embebido durante el entreno... se abre en una hoja inferior con el
 * reproductor de YouTube", para que un vídeo pesado no bloquee la
 * pantalla de registro. `youtube-nocookie.com` evita cookies de
 * seguimiento de terceros mientras no se le da a reproducir.
 *
 * Si el enlace no es una URL de YouTube reconocible (el campo no se
 * valida al guardarlo), se cae a un enlace normal en vez de una hoja
 * vacía.
 */
export function VideoSheet({ videoUrl, titulo, onCerrar }: VideoSheetProps) {
  const id = idDeYoutube(videoUrl);

  return (
    <BottomSheet titulo={titulo} onCerrar={onCerrar}>
      {id ? (
        <div className="aspect-video w-full overflow-hidden rounded-button bg-surface-2">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
            title={titulo}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="size-full"
          />
        </div>
      ) : (
        <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="text-body text-accent">
          Abrir vídeo en YouTube
        </a>
      )}
    </BottomSheet>
  );
}
