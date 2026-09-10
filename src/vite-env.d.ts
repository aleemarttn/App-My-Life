/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  /** URL del proyecto de Supabase. Publica. */
  readonly VITE_SUPABASE_URL: string;
  /** Clave anon. Publica por diseno: la seguridad vive en las RLS. */
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
