import { Routes } from '@angular/router';
import { authChildGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { Shell } from './layout/shell/shell';

export const routes: Routes = [
  // Publico: pantalla de login Maestro.
  {
    path: 'login',
    title: 'Login | OAM Master',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/pages/login-page/login-page').then((m) => m.LoginPage),
  },

  // Privado: todas las pantallas operativas bajo shell con auth guard.
  {
    path: '',
    component: Shell,
    canActivateChild: [authChildGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

      {
        path: 'dashboard',
        title: 'Dashboard | OAM Master',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard-page/dashboard-page').then(
            (m) => m.DashboardPage,
          ),
      },

      {
        path: 'runs',
        title: 'Runs | OAM Master',
        loadComponent: () =>
          import('./features/maestro/runs/pages/runs-list.page').then((m) => m.RunsListPage),
      },
      {
        path: 'runs/upload',
        title: 'Upload Catalog | OAM Master',
        loadComponent: () =>
          import('./features/runs/components/run-by-zip/run-by-zip').then((m) => m.RunByZip),
      },
      {
        path: 'runs/:runId',
        title: 'Run Detail | OAM Master',
        loadComponent: () =>
          import('./features/maestro/runs/pages/run-detail.page').then((m) => m.RunDetailPage),
      },
      {
        path: 'runs/:runId/compare',
        title: 'Run Compare | OAM Master',
        loadComponent: () =>
          import('./features/runs/pages/run-compare-page/run-compare-page').then(
            (m) => m.RunComparePage,
          ),
      },
      {
        path: 'review',
        title: 'Review Queue | OAM Master',
        loadComponent: () =>
          import('./features/review-queue/pages/review-queue-page/review-queue-page').then(
            (m) => m.ReviewQueuePage,
          ),
      },
      {
        path: 'review/:id',
        title: 'Review Detail | OAM Master',
        loadComponent: () =>
          import('./features/review-queue/pages/review-detail-page/review-detail-page').then(
            (m) => m.ReviewDetailPage,
          ),
      },

      {
        path: 'products',
        title: 'Products | OAM Master',
        loadComponent: () =>
          import('./features/products/pages/products-list-page/products-list-page').then(
            (m) => m.ProductsListPage,
          ),
      },
      {
        path: 'products/:id',
        title: 'Product Detail | OAM Master',
        loadComponent: () =>
          import('./features/products/pages/product-detail-page/product-detail-page').then(
            (m) => m.ProductDetailPage,
          ),
      },
      {
        path: 'variants',
        title: 'Variants | OAM Master',
        loadComponent: () =>
          import('./features/products/pages/variants-list-page/variants-list-page').then(
            (m) => m.VariantsListPage,
          ),
      },
      {
        path: 'variants/:id',
        title: 'Variant Detail | OAM Master',
        loadComponent: () =>
          import('./features/products/pages/variant-detail-page/variant-detail-page').then(
            (m) => m.VariantDetailPage,
          ),
      },

      {
        path: 'offers',
        title: 'Offers | OAM Master',
        loadComponent: () =>
          import('./features/offers/pages/offers-page/offers-page').then((m) => m.OffersPage),
      },
      {
        path: 'winners',
        title: 'Winners | OAM Master',
        loadComponent: () =>
          import('./features/offers/pages/winners-page/winners-page').then((m) => m.WinnersPage),
      },

      {
        path: 'pricing/rules',
        title: 'Pricing Rules | OAM Master',
        loadComponent: () =>
          import('./features/pricing/pages/pricing-rules-page/pricing-rules-page').then(
            (m) => m.PricingRulesPage,
          ),
      },
      {
        path: 'pricing/simulator',
        title: 'Pricing Simulator | OAM Master',
        loadComponent: () =>
          import('./features/pricing/pages/pricing-simulator-page/pricing-simulator-page').then(
            (m) => m.PricingSimulatorPage,
          ),
      },

      {
        path: 'suppliers',
        title: 'Suppliers | OAM Master',
        loadComponent: () =>
          import('./features/suppliers/pages/suppliers-page/suppliers-page').then(
            (m) => m.SuppliersPage,
          ),
      },

      {
        path: 'settings',
        title: 'Settings | OAM Master',
        loadComponent: () =>
          import('./features/settings/pages/settings-page/settings-page').then(
            (m) => m.SettingsPage,
          ),
      },

      {
        path: 'users',
        title: 'Users | OAM Master',
        loadComponent: () =>
          import('./features/users/pages/users-page/users-page').then((m) => m.UsersPage),
      },

      {
        path: 'odoo-sync',
        title: 'Odoo Sync | OAM Master',
        loadComponent: () =>
          import('./features/odoo-sync/pages/odoo-sync-page/odoo-sync-page').then(
            (m) => m.OdooSyncPage,
          ),
      },
      {
        path: 'odoo-sync/logs',
        title: 'Odoo Sync Logs | OAM Master',
        loadComponent: () =>
          import('./features/odoo-sync/pages/odoo-sync-logs-page/odoo-sync-logs-page').then(
            (m) => m.OdooSyncLogsPage,
          ),
      },

      { path: '**', redirectTo: 'dashboard' },
    ],
  },

  // Fallback final para rutas desconocidas fuera de shell.
  { path: '**', redirectTo: 'login' },
];
