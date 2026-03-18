# Estado del proyecto para completar integracion BD -> Odoo

Fecha: 2026-03-18
Repositorio: `oam-master-products` (frontend Angular)

## Objetivo evaluado

Completar el flujo para pasar datos de tu base de datos hacia Odoo de forma confiable y operable en produccion.

## Resumen ejecutivo

- Avance general estimado para el objetivo BD -> Odoo: **30-40%**.
- Lo administrativo/base de catalogo esta avanzado (auth, CRUD de productos y variantes).
- El nucleo de integracion con Odoo aun no esta implementado (pantallas sync en placeholder, sin servicios de sync reales, sin orquestacion backend visible en este repo).

## Lo que ya esta avanzado

- Autenticacion y proteccion de rutas privadas.
  - `src/app/core/services/auth.service.ts`
  - `src/app/core/guards/auth.guard.ts`
- CRUD funcional de productos/variantes/marcas/colecciones.
  - `src/app/core/services/maestro/productsMaster/OamProducts.service.ts`
  - `src/app/core/services/maestro/productsVariant/OamProductVariant.service.ts`
  - `src/app/core/services/maestro/brand/OamBrand.service.ts`
  - `src/app/core/services/maestro/collection/OamCollection.service.ts`
- Rutas y menu para modulo de sync Odoo ya definidos.
  - `src/app/app.routes.ts`
  - `src/app/layout/sidebar/sidebar.ts`
- Modelos de dominio para jobs/logs/config de sync ya definidos.
  - `src/app/core/models/odoo-sync.model.ts`

## Lista de pendientes para que el proyecto este completo

### P0 (critico, bloquea objetivo principal)

1. Implementar modulo Odoo Sync real en frontend (dashboard y logs, no placeholders).
   - Actual: `src/app/features/odoo-sync/pages/odoo-sync-page/odoo-sync-page.html` contiene `works!`
   - Actual: `src/app/features/odoo-sync/pages/odoo-sync-logs-page/odoo-sync-logs-page.html` contiene `works!`

2. Crear servicios HTTP de sync a Odoo.
   - Falta servicio tipo `OdooSyncService` con operaciones: crear job, consultar estado, cancelar/reintentar, listar logs y resumen.
   - Falta definir endpoints en `src/app/core/config/api.config.ts`.

3. Implementar backend de integracion BD -> Odoo (fuera de este repo frontend o en API asociada).
   - Extraccion de datos desde BD.
   - Transformacion al schema de Odoo.
   - Envio a Odoo API con manejo de autenticacion/errores.

4. Definir mapeo de campos Maestro -> Odoo y reglas de negocio.
   - Campos obligatorios, defaults, normalizacion de valores, validaciones previas al envio.

5. Garantizar idempotencia y deduplicacion.
   - Evitar creaciones duplicadas en Odoo al reintentar jobs o reprocesar lotes.

### P1 (alto impacto operativo)

6. Estrategia de reintentos y recuperacion.
   - Retry por tipo de error, cola de pendientes, reproceso selectivo por entidad.

7. Trazabilidad y auditoria completa.
   - Guardar payload, respuesta Odoo, error detallado y estado por registro.
   - Vista filtrable/exportable para soporte.

8. Orquestacion de sincronizacion.
   - Manual, incremental y programada (cron/queues/workers).
   - Control de concurrencia y limites de lote.

9. Monitoreo y alertas.
   - Metricas de exito/error, latencia, throughput, backlog.
   - Alertas por fallo sostenido.

10. Configuracion por ambientes.
    - Evitar `baseUrl` fijo en codigo (`src/app/core/config/api.config.ts`).
    - Usar variables por entorno (dev/staging/prod).

### P2 (calidad y cierre de producto)

11. Completar pantallas aun en placeholder en otros modulos.
    - Dashboard, runs, review, pricing, offers, settings, etc.

12. Actualizar y ampliar testing.
    - Ajustar tests desalineados como `src/app/app.spec.ts`.
    - Agregar pruebas de flujos criticos de sync y errores.

## Riesgos actuales si se libera asi

- No hay evidencia de sincronizacion real hacia Odoo en el frontend actual.
- Alta probabilidad de inconsistencias sin reglas de idempotencia/mapeo.
- Dificultad de soporte por falta de trazabilidad operativa robusta.

## Criterios de "proyecto completo" para tu objetivo

Se considera completo cuando, como minimo, exista:

- Flujo E2E funcional: BD -> transformacion -> Odoo -> confirmacion -> log.
- Sync manual e incremental operativos.
- Reintentos, manejo de errores y reproceso por registro.
- Dashboard y logs de sync utiles para operacion diaria.
- Monitoreo basico y alertas.
- Pruebas minimas de regresion de integracion.

## Siguiente paso recomendado

Armar un plan en 3 fases:

1. MVP tecnico de sync (crear job, ejecutar lote, ver estado/logs).
2. Robustez operativa (idempotencia, retries, auditoria).
3. Hardening productivo (monitoring, alertas, pruebas E2E y performance).
