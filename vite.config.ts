import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Sin UI de "hay una version nueva" todavia. Cuando exista el
      // modo entreno habra que revisar esto: una recarga automatica
      // a mitad de una serie seria inaceptable (ver docs/estado.md).
      registerType: "autoUpdate",

      // Permite probar la instalacion desde el movil sin compilar.
      devOptions: { enabled: true },

      includeAssets: ["favicon.svg", "apple-touch-icon-180x180.png"],

      manifest: {
        id: "/",
        name: "My Life",
        short_name: "My Life",
        description: "Registro y control de entrenamiento, comida, dinero y coche.",
        lang: "es",
        dir: "ltr",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#0B0C0E", // --bg
        theme_color: "#0B0C0E", // --bg
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },

      workbox: {
        // Precache del app-shell: lo unico que necesita la app para
        // arrancar sin red. Los DATOS no se cachean aqui — de eso se
        // encarga Dexie (spec §2.3). Cachear respuestas de Supabase
        // en Workbox duplicaria la fuente de verdad.
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        navigateFallback: "index.html",
        cleanupOutdatedCaches: true,
      },
    }),
  ],

  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },

  build: {
    rolldownOptions: {
      output: {
        // Cada libreria en su propio trozo. No reduce el total descargado la
        // primera vez, pero al desplegar una version nueva solo se invalida
        // el codigo de la app: React, Supabase y Dexie siguen en cache. En
        // una PWA que se actualiza a menudo eso es la diferencia entre bajar
        // 5 kB o 190 kB en cada despliegue.
        codeSplitting: {
          groups: [
            { name: "supabase", test: /node_modules[\\/]@supabase[\\/]/ },
            { name: "react", test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            { name: "router", test: /node_modules[\\/]react-router[\\/]/ },
            { name: "dexie", test: /node_modules[\\/]dexie[\\/]/ },
          ],
        },
      },
    },
  },

  // host: true expone el dev server en la red local para poder abrir
  // la app desde el iPhone y comprobar zonas tactiles y area segura.
  server: { host: true },
});
