import { createBrowserRouter } from "react-router";
import { AppLayout } from "./AppLayout";
import { Dashboard } from "./Dashboard";

export const router = createBrowserRouter([
  {
    path: "/entreno/modo",
    lazy: async () => ({
      Component: (await import("@/modules/training/ModoEntreno")).ModoEntreno,
    }),
  },
  {
    path: "/entreno/dia/:diaId",
    lazy: async () => ({
      Component: (await import("@/modules/training/DetalleDiaScreen")).DetalleDiaScreen,
    }),
  },
  {
    path: "/entreno/ejercicio/:exerciseId",
    lazy: async () => ({
      Component: (await import("@/modules/training/DetalleEjercicioScreen")).DetalleEjercicioScreen,
    }),
  },
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
        path: "entreno/importar",
        lazy: async () => ({
          Component: (await import("@/modules/training/ImportarRutinaScreen")).ImportarRutinaScreen,
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
        path: "salud",
        lazy: async () => ({
          Component: (await import("@/modules/health/SaludScreen")).SaludScreen,
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