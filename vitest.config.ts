import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Configuracion propia, separada de vite.config.ts a proposito: los tests
 * de core/db no necesitan React, Tailwind ni el service worker, y cargar
 * esos plugins solo haria la suite mas lenta y mas fragil.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["./src/test/setup.ts"],
  },
});
