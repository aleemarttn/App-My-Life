// Edge Function `translate-routine` (spec §2.5/§4.6, capa LLM aparcada el
// 18/09/2026, construida el 23/09/2026).
//
// Traduce un Excel de entrenador en formato libre (bloques de dia, notacion
// combinada "4x8-10", descanso en texto...) al formato canonico de filas
// que ya validan `importarFormato.ts` y empareja `importarEmparejar.ts`.
// Esta funcion NO valida, NO empareja ejercicios y NO escribe nada: solo
// traduce. Todo lo demas del importador sigue exactamente igual (D2: capa
// determinista primero -- el formato canonico ya se lee sin pasar por
// aqui --, capa LLM solo de fallback, JSON estricto contra esquema).
//
// Entrada:  { hojas: { nombre: string; filas: string[][] }[] }
// Salida:   { filas: Record<string, unknown>[] }
//
// El cliente pasa el resultado directo a `validarFilas()`: si la IA se
// equivoca en una fila, aparecen los mismos errores por fila que ya conoce
// el usuario de un Excel canonico mal rellenado. Nada se confirma sin que
// el usuario revise el resumen (igual que hoy).

const ALLOWED_ORIGINS = new Set([
  "https://app-my-life.vercel.app",
  "http://localhost:5173",
]);

function corsHeaders(origin: string | null): HeadersInit {
  const allow = origin != null && ALLOWED_ORIGINS.has(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

// Misma cascada que `analizar-imagen` en NutriGasto (v22, 10-sep-2026):
// gemini-flash-latest da 503 "high demand" a rachas en el tier gratuito y
// se recupera solo, asi que el siguiente modelo de la lista absorbe el
// pico en vez de dejar al usuario sin nada.
const MODELOS = ["gemini-flash-latest", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-flash-lite"];

const COLUMNAS = [
  "semana",
  "dia",
  "ejercicio",
  "tipo",
  "series",
  "reps_min",
  "reps_max",
  "peso",
  "rir",
  "duracion_seg",
  "distancia_m",
  "descanso_seg",
  "video_url",
  "notas",
] as const;

// Todo como STRING a proposito: `validarFilas()` ya sabe convertir texto
// ("82,5", "") a numero o null (coma decimal incluida). Pedirle a Gemini
// tipos mixtos con nulos opcionales es fragil; pedirle strings y dejar que
// la capa determinista ya probada haga la conversion no lo es.
const ESQUEMA_RESPUESTA = {
  type: "OBJECT",
  properties: {
    filas: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: Object.fromEntries(COLUMNAS.map((c) => [c, { type: "STRING" }])),
        required: ["semana", "dia", "ejercicio", "tipo"],
      },
    },
  },
  required: ["filas"],
};

const INSTRUCCIONES = `Eres un traductor de rutinas de gimnasio. Te paso el contenido de un Excel de un entrenador personal, tal cual, con sus bloques de dia, notacion abreviada y columnas en el orden que sea. Tu unico trabajo es reestructurarlo en una fila por ejercicio con estas columnas exactas, sin inventar datos que no esten en el archivo:

- semana: numero de semana del mesociclo (entero desde 1). Si el archivo no distingue semanas, usa 1 para todo.
- dia: etiqueta del dia, idealmente "Lunes - Pierna" (dia de la semana en espanol + foco si lo hay). Si el archivo no da el dia de la semana, usa lo que tenga ("Dia 1", "Sesion A"...).
- ejercicio: nombre del ejercicio tal cual aparece.
- tipo: uno de "strength" (peso y repeticiones), "cardio" (duracion o distancia, sin peso), "time" (isometricos, por tiempo) o "distance" (por distancia). Si no esta explicito, dedúcelo del propio ejercicio.
- series: numero de series. "4x8-10" -> series=4.
- reps_min / reps_max: rango de repeticiones. "4x8-10" -> reps_min=8, reps_max=10. Un solo numero de reps ("4x10") -> reps_min=reps_max=10.
- peso: peso pautado si el archivo lo da. Vacio si no.
- rir: repeticiones en reserva si el archivo lo da (RIR o RPE convertido a RIR = 10 - RPE). Vacio si no.
- duracion_seg: duracion en segundos ("30 min" -> 1800). Solo para cardio/time.
- distancia_m: distancia en metros ("5 km" -> 5000). Solo para cardio/distance.
- descanso_seg: descanso en segundos ("2 min" -> 120, "90 seg" -> 90). Vacio si no se especifica.
- video_url: URL de video si el archivo la trae. Vacio si no.
- notas: cualquier anotacion del entrenador que no encaje en las columnas anteriores (superset, tecnica, progresion, "AMRAP", etc), tal cual, sin resumir.

Deja una columna vacia ("") en vez de adivinar un valor que no esta en el archivo: los huecos los rellena despues el propio usuario. No agrupes ejercicios ni los combines. Devuelve TODAS las filas de ejercicio que encuentres en TODAS las hojas.`;

interface FilaCruda {
  nombre: string;
  filas: string[][];
}

function formatearHoja(hoja: FilaCruda): string {
  const cuerpo = hoja.filas.map((fila) => fila.join(" | ")).join("\n");
  return `## Hoja: ${hoja.nombre}\n${cuerpo}`;
}

class ErrorTraduccion extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

async function pedirAlPrimerModeloQueResponda(prompt: string, apiKey: string): Promise<unknown> {
  let ultimoError: unknown = null;

  for (const modelo of MODELOS) {
    for (let intento = 0; intento < 2; intento++) {
      const respuesta = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: ESQUEMA_RESPUESTA,
              temperature: 0,
            },
          }),
        },
      );

      if (respuesta.ok) {
        const cuerpo = await respuesta.json();
        const texto = cuerpo?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (typeof texto !== "string") {
          ultimoError = new Error(`Respuesta sin texto del modelo ${modelo}.`);
          break; // pasar al siguiente modelo, reintentar esto no ayuda
        }
        return JSON.parse(texto);
      }

      if (respuesta.status === 429) {
        // Cuota de la clave agotada: reintentar u otro modelo no arregla nada.
        throw new ErrorTraduccion("CUOTA_EXCEDIDA", 429);
      }
      if (respuesta.status === 503 && intento === 0) {
        ultimoError = new Error(`503 de ${modelo}, reintentando`);
        continue; // un reintento antes de descartar el modelo
      }
      // 503 en el segundo intento, o 404/400: saltar al siguiente modelo.
      ultimoError = new Error(`${respuesta.status} de ${modelo}: ${await respuesta.text()}`);
      break;
    }
  }

  throw new ErrorTraduccion(
    `MODELO_SATURADO: ${ultimoError instanceof Error ? ultimoError.message : String(ultimoError)}`,
    503,
  );
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  if (req.method === "OPTIONS") return new Response(null, { headers });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método no permitido." }), {
      status: 405,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  try {
    const apiKey = Deno.env.get("LLM_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Falta LLM_API_KEY en los secretos del proyecto." }), {
        status: 500,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const cuerpo = await req.json();
    const hojas = cuerpo?.hojas as FilaCruda[] | undefined;
    if (!Array.isArray(hojas) || hojas.length === 0) {
      return new Response(JSON.stringify({ error: "Falta «hojas» o está vacío." }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    // Tope de tamaño: un mesociclo real son unas 150-200 filas. Muy por
    // encima de eso, o rechazarlo (coste/latencia) o es un archivo que no
    // es una rutina.
    const totalCeldas = hojas.reduce((n, h) => n + h.filas.reduce((m, f) => m + f.length, 0), 0);
    if (totalCeldas > 20000) {
      return new Response(JSON.stringify({ error: "El archivo es demasiado grande para traducirlo con IA." }), {
        status: 413,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const prompt = `${INSTRUCCIONES}\n\n${hojas.map(formatearHoja).join("\n\n")}`;
    const resultado = await pedirAlPrimerModeloQueResponda(prompt, apiKey);

    const filas = (resultado as { filas?: unknown })?.filas;
    if (!Array.isArray(filas)) {
      return new Response(JSON.stringify({ error: "La IA no devolvió el formato esperado." }), {
        status: 502,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ filas }), {
      headers: { ...headers, "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof ErrorTraduccion) {
      const mensaje = error.message.startsWith("CUOTA_EXCEDIDA")
        ? "Se agotó la cuota de la clave de IA."
        : "La IA está saturada ahora mismo. Espera unos segundos y vuelve a intentarlo.";
      return new Response(JSON.stringify({ error: mensaje }), {
        status: error.status,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Fallo desconocido." }),
      { status: 500, headers: { ...headers, "Content-Type": "application/json" } },
    );
  }
});
