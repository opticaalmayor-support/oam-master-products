Write-Host "🚀 Generando estructura OAM Master..."

# Layout
npx ng g c layout/shell --standalone --skip-tests
npx ng g c layout/sidebar --standalone --skip-tests
npx ng g c layout/topbar --standalone --skip-tests

# Dashboard
npx ng g c features/dashboard/pages/dashboard-page --standalone --skip-tests

# Runs
npx ng g c features/runs/pages/runs-list-page --standalone --skip-tests
npx ng g c features/runs/pages/run-detail-page --standalone --skip-tests
npx ng g c features/runs/pages/run-compare-page --standalone --skip-tests

# Review Queue
npx ng g c features/review-queue/pages/review-queue-page --standalone --skip-tests
npx ng g c features/review-queue/pages/review-detail-page --standalone --skip-tests

# Products
npx ng g c features/products/pages/products-list-page --standalone --skip-tests
npx ng g c features/products/pages/product-detail-page --standalone --skip-tests
npx ng g c features/products/pages/variant-detail-page --standalone --skip-tests

# Offers
npx ng g c features/offers/pages/offers-page --standalone --skip-tests
npx ng g c features/offers/pages/winners-page --standalone --skip-tests

# Pricing
npx ng g c features/pricing/pages/pricing-rules-page --standalone --skip-tests
npx ng g c features/pricing/pages/pricing-simulator-page --standalone --skip-tests

# Suppliers
npx ng g c features/suppliers/pages/suppliers-page --standalone --skip-tests

# Settings
npx ng g c features/settings/pages/settings-page --standalone --skip-tests

# Odoo Sync
npx ng g c features/odoo-sync/pages/odoo-sync-page --standalone --skip-tests
npx ng g c features/odoo-sync/pages/odoo-sync-logs-page --standalone --skip-tests

# Shared Components
npx ng g c shared/components/stat-card --standalone --skip-tests
npx ng g c shared/components/data-table --standalone --skip-tests
npx ng g c shared/components/badge --standalone --skip-tests
npx ng g c shared/components/confirm-dialog --standalone --skip-tests
npx ng g c shared/components/stepper --standalone --skip-tests
npx ng g c shared/components/empty-state --standalone --skip-tests

# Core Services
npx ng g s core/api/runs-api --skip-tests
npx ng g s core/api/products-api --skip-tests
npx ng g s core/api/review-api --skip-tests
npx ng g s core/api/offers-api --skip-tests
npx ng g s core/api/pricing-api --skip-tests
npx ng g s core/api/suppliers-api --skip-tests
npx ng g s core/api/odoo-api --skip-tests

npx ng g s core/services/toast --skip-tests
npx ng g s core/services/loading --skip-tests
npx ng g s core/services/theme --skip-tests

npx ng g guard core/guards/auth --skip-tests

Write-Host "✅ Estructura generada correctamente."
