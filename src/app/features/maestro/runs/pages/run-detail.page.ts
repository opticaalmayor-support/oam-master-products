import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { RawProductsTableComponent } from '../components/raw-products-table.component';
import { RunHeaderComponent } from '../components/run-header.component';
import { RunKpisComponent } from '../components/run-kpis.component';
import { RawProductsPagination, RawProduct } from '../models/raw-product.model';
import { CatalogRun } from '../models/run.model';
import { RunsApi } from '../services/runs.api';

type DetailAction = 'start' | 'normalize';

@Component({
  selector: 'app-run-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink, RunHeaderComponent, RunKpisComponent, RawProductsTableComponent],
  templateUrl: './run-detail.page.html',
})
export class RunDetailPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(RunsApi);

  readonly run = signal<CatalogRun | null>(null);
  readonly products = signal<RawProduct[]>([]);

  readonly isLoadingRun = signal(true);
  readonly isLoadingProducts = signal(true);
  readonly isSubmitting = signal(false);

  readonly runError = signal<string | null>(null);
  readonly productsError = signal<string | null>(null);
  readonly toast = signal<{ type: 'success' | 'error'; message: string } | null>(null);
  readonly showConfirmModal = signal(false);
  readonly pendingAction = signal<DetailAction | null>(null);

  readonly pagination = signal<RawProductsPagination>({
    current_page: 1,
    last_page: 1,
    per_page: 25,
    total: 0,
  });
  readonly search = signal('');

  private runId = 0;
  private autoRefreshIntervalId: ReturnType<typeof setInterval> | null = null;
  private toastTimeoutId: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    const runId = Number(this.route.snapshot.paramMap.get('runId'));
    if (!runId) {
      this.runError.set('Run invalido.');
      this.isLoadingRun.set(false);
      this.isLoadingProducts.set(false);
      return;
    }
    this.runId = runId;

    this.route.queryParamMap.subscribe(params => {
      const page = Number(params.get('page') ?? 1);
      const perPage = Number(params.get('per_page') ?? 25);
      const search = params.get('search') ?? '';

      this.search.set(search);
      this.pagination.update(state => ({
        ...state,
        current_page: Number.isFinite(page) && page > 0 ? page : 1,
        per_page: Number.isFinite(perPage) && perPage > 0 ? perPage : 25,
      }));

      this.loadRunAndProductsInParallel();
    });
  }

  ngOnDestroy(): void {
    if (this.autoRefreshIntervalId) clearInterval(this.autoRefreshIntervalId);
    if (this.toastTimeoutId) clearTimeout(this.toastTimeoutId);
  }

  openAction(action: DetailAction): void {
    this.pendingAction.set(action);
    this.showConfirmModal.set(true);
  }

  closeAction(): void {
    if (this.isSubmitting()) return;
    this.pendingAction.set(null);
    this.showConfirmModal.set(false);
  }

  executeAction(): void {
    const run = this.run();
    const action = this.pendingAction();
    if (!run || !action) return;

    this.isSubmitting.set(true);
    const request$ = action === 'start' ? this.api.startRun(run.id) : this.api.normalizeRun(run.id);

    request$.subscribe({
      next: updatedRun => {
        this.run.set(updatedRun);
        this.syncAutoRefresh(updatedRun.status);
        this.showToast(
          'success',
          action === 'start' ? 'Run iniciado correctamente.' : 'Run normalizado correctamente.',
        );
        this.closeAction();
        this.isSubmitting.set(false);
        this.loadProductsOnly();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.showToast('error', err?.error?.message ?? 'No se pudo ejecutar la accion.');
      },
    });
  }

  canStart(): boolean {
    return this.run()?.status === 'pending';
  }

  canNormalize(): boolean {
    return this.run()?.status === 'completed';
  }

  onPageChange(page: number): void {
    this.updateQueryParams({ page });
  }

  onPerPageChange(perPage: number): void {
    this.updateQueryParams({ per_page: perPage, page: 1 });
  }

  onSearchChange(search: string): void {
    this.updateQueryParams({ search, page: 1 });
  }

  goBack(): void {
    void this.router.navigate(['/runs']);
  }

  private loadRunAndProductsInParallel(): void {
    this.isLoadingRun.set(true);
    this.isLoadingProducts.set(true);
    this.runError.set(null);
    this.productsError.set(null);

    forkJoin({
      run: this.api.getRun(this.runId),
      raw: this.api.getRawProducts(this.runId, {
        page: this.pagination().current_page,
        per_page: this.pagination().per_page,
        search: this.search(),
      }),
    }).subscribe({
      next: ({ run, raw }) => {
        this.run.set(run);
        this.products.set(raw.data);
        this.pagination.set(raw.pagination);
        this.isLoadingRun.set(false);
        this.isLoadingProducts.set(false);
        this.syncAutoRefresh(run.status);
      },
      error: (err) => {
        this.isLoadingRun.set(false);
        this.isLoadingProducts.set(false);
        this.runError.set(err?.error?.message ?? 'No se pudo cargar el detalle del run.');
      },
    });
  }

  private loadProductsOnly(): void {
    this.isLoadingProducts.set(true);
    this.productsError.set(null);

    this.api
      .getRawProducts(this.runId, {
        page: this.pagination().current_page,
        per_page: this.pagination().per_page,
        search: this.search(),
      })
      .subscribe({
        next: raw => {
          this.products.set(raw.data);
          this.pagination.set(raw.pagination);
          this.isLoadingProducts.set(false);
        },
        error: (err) => {
          this.isLoadingProducts.set(false);
          this.productsError.set(err?.error?.message ?? 'No se pudo cargar el grid de productos raw.');
        },
      });
  }

  private updateQueryParams(params: { page?: number; per_page?: number; search?: string }): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        page: params.page ?? this.pagination().current_page,
        per_page: params.per_page ?? this.pagination().per_page,
        search: params.search ?? this.search(),
      },
      queryParamsHandling: 'merge',
    });
  }

  private syncAutoRefresh(status: string): void {
    const active = ['pending', 'init', 'loaded'].includes(status);
    if (active && !this.autoRefreshIntervalId) {
      this.autoRefreshIntervalId = setInterval(() => this.refreshRunSilently(), 5000);
    }
    if (!active && this.autoRefreshIntervalId) {
      clearInterval(this.autoRefreshIntervalId);
      this.autoRefreshIntervalId = null;
    }
  }

  private refreshRunSilently(): void {
    this.api.getRun(this.runId).subscribe({
      next: run => {
        this.run.set(run);
        this.syncAutoRefresh(run.status);
      },
      error: () => {
        if (this.autoRefreshIntervalId) {
          clearInterval(this.autoRefreshIntervalId);
          this.autoRefreshIntervalId = null;
        }
      },
    });
  }

  private showToast(type: 'success' | 'error', message: string): void {
    this.toast.set({ type, message });
    if (this.toastTimeoutId) clearTimeout(this.toastTimeoutId);
    this.toastTimeoutId = setTimeout(() => this.toast.set(null), 3200);
  }
}
