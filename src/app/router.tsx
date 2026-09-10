import { createBrowserRouter } from "react-router";
import { AppLayout } from "./AppLayout";
import { Dashboard } from "./Dashboard";

/**
 * Rutas de la aplicacion.
 *
 * Inicio va cargado desde el principio porque es la pantalla de arranque y
 * meterla en un trozo aparte solo añadiria una espera. Todo lo demas se carga
 * bajo demanda: cada modulo es su propio trozo, asi abrir la app no descarga
 * codigo del coche ni de economia. Esto es tambien lo que deja preparada la
 * regla de `CLAUDE.md` de que el bundle de graficas nunca entre en el arranque
 * del modo entreno.
 */
export const router = createBrowserRouter([
  {
    path: "/",
    Component: AppLayout,
    children: [
      { index: true, Component: Dashboard },
      {
        path: "entreno",
        lazy: async () => ({
          Component: (await import("@/modules/training/TrainingScreen")).TrainingScreen,
        }),
      },
      {
        path: "comida",
        lazy: async () => ({
          Component: (await import("@/modules/nutrition/NutritionScreen")).NutritionScreen,
        }),
      },
      {
        path: "dinero",
        lazy: async () => ({
          Component: (await import("@/modules/finance/FinanceScreen")).FinanceScreen,
        }),
      },
      {
        path: "coche",
        lazy: async () => ({
          Component: (await import("@/modules/car/CarScreen")).CarScreen,
        }),
      },
      {
        path: "perfil",
        lazy: async () => ({
          Component: (await import("./profile/ProfileScreen")).ProfileScreen,
        }),
      },
      {
        path: "perfil/diseno",
        lazy: async () => ({
          Component: (await import("./DesignCheck")).DesignCheck,
        }),
      },
      {
        path: "*",
        lazy: async () => ({
          Component: (await import("./NotFound")).NotFound,
        }),
      },
    ],
  },
]);
