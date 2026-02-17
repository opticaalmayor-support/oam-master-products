import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

  // Dashboard
  {
    path: 'dashboard',
    title: 'Dashboard | OAM Master',
    loadComponent: () =>
      import('./features/dashboard/pages/dashboard-page/dashboard-page')
        .then(m => m.DashboardPage),
  },

  // Runs
  {
    path: 'runs',
    title: 'Runs | OAM Master',
    loadComponent: () =>
      import('./features/runs/pages/runs-list-page/runs-list-page')
        .then(m => m.RunsListPage),
  },
  {
    path: 'runs/:runId',
    title: 'Run Detail | OAM Master',
    loadComponent: () =>
      import('./features/runs/pages/run-detail-page/run-detail-page')
        .then(m => m.RunDetailPage),
  },
  {
    path: 'runs/:runId/compare',
    title: 'Run Compare | OAM Master',
    loadComponent: () =>
      import('./features/runs/pages/run-compare-page/run-compare-page')
        .then(m => m.RunComparePage),
  },

  // Review Queue
  {
    path: 'review',
    title: 'Review Queue | OAM Master',
    loadComponent: () =>
      import('./features/review-queue/pages/review-queue-page/review-queue-page')
        .then(m => m.ReviewQueuePage),
  },
  {
    path: 'review/:id',
    title: 'Review Detail | OAM Master',
    loadComponent: () =>
      import('./features/review-queue/pages/review-detail-page/review-detail-page')
        .then(m => m.ReviewDetailPage),
  },

  // Products
  {
    path: 'products',
    title: 'Products | OAM Master',
    loadComponent: () =>
      import('./features/products/pages/products-list-page/products-list-page')
        .then(m => m.ProductsListPage),
  },
  {
    path: 'products/:id',
    title: 'Product Detail | OAM Master',
    loadComponent: () =>
      import('./features/products/pages/product-detail-page/product-detail-page')
        .then(m => m.ProductDetailPage),
  },
  {
    path: 'variants/:id',
    title: 'Variant Detail | OAM Master',
    loadComponent: () =>
      import('./features/products/pages/variant-detail-page/variant-detail-page')
        .then(m => m.VariantDetailPage),
  },

  // Offers / Winners
  {
    path: 'offers',
    title: 'Offers | OAM Master',
    loadComponent: () =>
      import('./features/offers/pages/offers-page/offers-page')
        .then(m => m.OffersPage),
  },
  {
    path: 'winners',
    title: 'Winners | OAM Master',
    loadComponent: () =>
      import('./features/offers/pages/winners-page/winners-page')
        .then(m => m.WinnersPage),
  },

  // Pricing
  {
    path: 'pricing/rules',
    title: 'Pricing Rules | OAM Master',
    loadComponent: () =>
      import('./features/pricing/pages/pricing-rules-page/pricing-rules-page')
        .then(m => m.PricingRulesPage),
  },
  {
    path: 'pricing/simulator',
    title: 'Pricing Simulator | OAM Master',
    loadComponent: () =>
      import('./features/pricing/pages/pricing-simulator-page/pricing-simulator-page')
        .then(m => m.PricingSimulatorPage),
  },

  // Suppliers
  {
    path: 'suppliers',
    title: 'Suppliers | OAM Master',
    loadComponent: () =>
      import('./features/suppliers/pages/suppliers-page/suppliers-page')
        .then(m => m.SuppliersPage),
  },

  // Settings
  {
    path: 'settings',
    title: 'Settings | OAM Master',
    loadComponent: () =>
      import('./features/settings/pages/settings-page/settings-page')
        .then(m => m.SettingsPage),
  },

  // Odoo Sync
  {
    path: 'odoo-sync',
    title: 'Odoo Sync | OAM Master',
    loadComponent: () =>
      import('./features/odoo-sync/pages/odoo-sync-page/odoo-sync-page')
        .then(m => m.OdooSyncPage),
  },
  {
    path: 'odoo-sync/logs',
    title: 'Odoo Sync Logs | OAM Master',
    loadComponent: () =>
      import('./features/odoo-sync/pages/odoo-sync-logs-page/odoo-sync-logs-page')
        .then(m => m.OdooSyncLogsPage),
  },

  // 404
  { path: '**', redirectTo: 'dashboard' },
];