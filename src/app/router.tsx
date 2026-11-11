import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RouteTransitionRoot } from '../components/navigation/RouteTransitions';

export const appRouter = createBrowserRouter([
  {
    path: '/',
    Component: RouteTransitionRoot,
    children: [
      {
        hydrateFallbackElement: <p className="container section" role="status">Cargando página…</p>,
        lazy: async () => {
          const { PublicLayout } = await import('../layouts/PublicLayout');
          return { Component: PublicLayout };
        },
        children: [
          {
            index: true,
            lazy: async () => {
              const { HomePage } = await import('../features/catalog/pages/HomePage');
              return { Component: HomePage };
            },
          },
          {
            path: 'catalogo',
            lazy: async () => {
              const { CatalogPage } = await import('../features/catalog/pages/CatalogPage');
              return { Component: CatalogPage };
            },
          },
          {
            path: 'vehiculos/:id',
            lazy: async () => {
              const { VehicleDetailPage } = await import('../features/catalog/pages/VehicleDetailPage');
              return { Component: VehicleDetailPage };
            },
          },
          {
            path: 'login',
            lazy: async () => {
              const { LoginPage } = await import('../features/auth/pages/LoginPage');
              return { Component: LoginPage };
            },
          },
          {
            path: 'forgot-password',
            lazy: async () => {
              const { ForgotPasswordPage } = await import('../features/auth/pages/ForgotPasswordPage');
              return { Component: ForgotPasswordPage };
            },
          },
        ],
      },
      {
        path: 'admin',
        hydrateFallbackElement: <p className="container section" role="status">Cargando panel…</p>,
        lazy: async () => {
          const { ProtectedRoute } = await import('./ProtectedRoute');
          return { Component: ProtectedRoute };
        },
        children: [
          {
            lazy: async () => {
              const { DashboardLayout } = await import('../layouts/DashboardLayout');
              return { Component: DashboardLayout };
            },
            children: [
              {
                index: true,
                lazy: async () => {
                  const { DashboardPage } = await import('../features/dashboard/pages/DashboardPage');
                  return { Component: DashboardPage };
                },
              },
              {
                path: 'vehiculos',
                lazy: async () => {
                  const { VehiclesPage } = await import('../features/dashboard/pages/VehiclesPage');
                  return { Component: VehiclesPage };
                },
              },
              {
                path: 'vehiculos/nuevo',
                lazy: async () => {
                  const { VehicleFormPage } = await import('../features/vehicles/pages/VehicleFormPage');
                  return { Component: VehicleFormPage };
                },
              },
              {
                path: 'vehiculos/:id/editar',
                lazy: async () => {
                  const { VehicleFormPage } = await import('../features/vehicles/pages/VehicleFormPage');
                  return { Component: VehicleFormPage };
                },
              },
              {
                path: 'configuracion',
                lazy: async () => {
                  const { SettingsPage } = await import('../features/settings/pages/SettingsPage');
                  return { Component: SettingsPage };
                },
              },
            ],
          },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
