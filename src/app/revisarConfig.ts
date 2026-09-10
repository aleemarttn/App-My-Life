export interface ProblemaConfig {
  variable: string;
  problema: string;
  /** true = la app no debe arrancar bajo ningun concepto. */
  grave?: boolean;
}

/**
 * Revisa la configuracion de Supabase ANTES de arrancar la aplicacion.
 *
 * No comprueba solo que las variables existan, sino que sean lo que dicen
 * ser. El motivo es real y ya ha pasado: en el primer despliegue se pegaron
 * dos JWT cruzados, con la clave `service_role` en el hueco de la clave
 * anon. Como ambas cadenas estaban rellenas, una comprobacion de "no vacio"
 * daba el visto bueno, la app se caia sin mensaje y —lo importante— la clave
 * que se salta TODAS las politicas RLS quedaba publicada en un archivo
 * JavaScript que cualquiera podia descargar.
 *
 * Una comprobacion que solo mira si el valor esta vacio no habria detectado
 * nada de eso.
 */

/** Decodifica el payload de un JWT. Devuelve null si no lo es. */
function payloadDeJwt(valor: string): Record<string, unknown> | null {
  const partes = valor.split(".");
  if (partes.length !== 3) return null;
  try {
    const base64 = partes[1]!.replace(/-/g, "+").replace(/_/g, "/");
    const relleno = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json: unknown = JSON.parse(atob(relleno));
    return typeof json === "object" && json !== null ? (json as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function rolDeClave(valor: string): string | null {
  const payload = payloadDeJwt(valor);
  return typeof payload?.["role"] === "string" ? payload["role"] : null;
}

export function revisarConfig(
  url: string | undefined,
  clave: string | undefined,
): ProblemaConfig[] {
  const problemas: ProblemaConfig[] = [];

  // ---- URL ----
  if (!url) {
    problemas.push({ variable: "VITE_SUPABASE_URL", problema: "No está definida." });
  } else if (rolDeClave(url) !== null) {
    problemas.push({
      variable: "VITE_SUPABASE_URL",
      problema:
        "Contiene una clave, no una URL. Debe ser algo como https://<proyecto>.supabase.co",
      grave: true,
    });
  } else if (!/^https:\/\/[^\s/]+/.test(url)) {
    problemas.push({
      variable: "VITE_SUPABASE_URL",
      problema: "No parece una URL https válida.",
    });
  }

  // ---- Clave ----
  if (!clave) {
    problemas.push({ variable: "VITE_SUPABASE_ANON_KEY", problema: "No está definida." });
  } else {
    const rol = rolDeClave(clave);
    if (rol === "service_role") {
      problemas.push({
        variable: "VITE_SUPABASE_ANON_KEY",
        problema:
          "Es la clave service_role, que se salta todas las políticas RLS. " +
          "Nunca puede ir en el cliente: rótala en Supabase y pon aquí la clave anon.",
        grave: true,
      });
    } else if (rol !== null && rol !== "anon") {
      problemas.push({
        variable: "VITE_SUPABASE_ANON_KEY",
        problema: `Es una clave con rol "${rol}". Aquí va la clave anon.`,
        grave: true,
      });
    }
  }

  return problemas;
}
