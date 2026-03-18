import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { RunStatusBadgeComponent } from '../components/run-status-badge.component';
import { CatalogRun, RunsListQuery } from '../models/run.model';
import { RunsApi } from '../services/runs.api';
import { RUN_STATUS_MAP } from '../utils/run-status-map';

type RowAction = 'start' | 'normalize';

@Component({
  selector: 'app-runs-list-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RunStatusBadgeComponent, DatePipe],
  templateUrl: './runs-list.page.html',
})
export class RunsListPage implements OnInit, OnDestroy {
  private readonly api = inject(RunsApi);
  private readonly router = inject(Router);

  readonly runs = signal<CatalogRun[]>([]);
  readonly suppliers = signal<Array<{ id: number; name: string; code: string }>>([]);

  readonly isLoading = signal(true);
  readonly isSubmittingAction = signal(false);
  readonly isAutoRefreshing = signal(false);
  readonly actionRunId = signal<number | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly page = signal(1);
  readonly perPage = signal(25);
  readonly total = signal(0);
  readonly lastPage = signal(1);

  readonly supplierIdFilter = signal<number | null>(null);
  readonly statusFilter = signal<string>('');
  readonly runKeyFilter = signal('');

  readonly showConfirmModal = signal(false);
  readonly confirmAction = signal<RowAction | null>(null);
  readonly targetRun = signal<CatalogRun | null>(null);

  readonly toast = signal<{ type: 'success' | 'error'; message: string } | null>(null);

  readonly statusOptions = computed(() => Object.entries(RUN_STATUS_MAP));

  private autoRefreshIntervalId: ReturnType<typeof setInterval> | null = null;
  private readonly autoRefreshMs = 5000;
  private toastTimeoutId: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.loadSuppliers();
    this.loadRuns();
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
    if (this.toastTimeoutId) clearTimeout(this.toastTimeoutId);
  }

  loadRuns(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.api
      .getRuns(this.queryParams())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ data, pagination }) => {
          this.runs.set(data);
          this.total.set(pagination.total);
          this.lastPage.set(pagination.last_page || 1);
          this.page.set(pagination.current_page || 1);
          this.perPage.set(pagination.per_page || this.perPage());
          this.syncAutoRefresh(data);
        },
        error: (err) => {
          this.errorMessage.set(err?.error?.message ?? 'No se pudo cargar el listado de runs.');
          this.runs.set([]);
          this.stopAutoRefresh();
        },
      });
  }

  refreshSilently(): void {
    this.api.getRuns(this.queryParams()).subscribe({
      next: ({ data, pagination }) => {
        this.runs.set(data);
        this.total.set(pagination.total);
        this.lastPage.set(pagination.last_page || 1);
        this.page.set(pagination.current_page || 1);
        this.syncAutoRefresh(data);
      },
      error: () => {
        this.stopAutoRefresh();
      },
    });
  }

  loadSuppliers(): void {
    this.api.getSuppliers().subscribe({
      next: data => this.suppliers.set(data),
      error: () => this.suppliers.set([]),
    });
  }

  applyFilters(): void {
    this.page.set(1);
    this.loadRuns();
  }

  clearFilters(): void {
    this.supplierIdFilter.set(null);
    this.statusFilter.set('');
    this.runKeyFilter.set('');
    this.page.set(1);
    this.loadRuns();
  }

  goToPage(nextPage: number): void {
    if (nextPage < 1 || nextPage > this.lastPage() || nextPage === this.page()) return;
    this.page.set(nextPage);
    this.loadRuns();
  }

  onPerPageChange(): void {
    this.page.set(1);
    this.loadRuns();
  }

  viewDetail(run: CatalogRun): void {
    void this.router.navigate(['/runs', run.id]);
  }

  openConfirm(run: CatalogRun, action: RowAction): void {
    this.targetRun.set(run);
    this.confirmAction.set(action);
    this.showConfirmModal.set(true);
  }

  closeConfirm(): void {
    if (this.isSubmittingAction()) return;
    this.showConfirmModal.set(false);
    this.targetRun.set(null);
    this.confirmAction.set(null);
  }

  executeAction(): void {
    const action = this.confirmAction();
    const run = this.targetRun();
    if (!action || !run) return;

    this.isSubmittingAction.set(true);
    this.actionRunId.set(run.id);

    const request$ = action === 'start' ? this.api.startRun(run.id) : this.api.normalizeRun(run.id);
    request$
      .pipe(
        finalize(() => {
          this.isSubmittingAction.set(false);
          this.actionRunId.set(null);
        }),
      )
      .subscribe({
        next: () => {
          this.showToast('success', action === 'start' ? 'Run iniciado correctamente.' : 'Run normalizado correctamente.');
          this.closeConfirm();
          this.refreshSilently();
        },
        error: (err) => {
          this.showToast('error', err?.error?.message ?? 'No se pudo ejecutar la accion.');
        },
      });
  }

  canStart(run: CatalogRun): boolean {
    return run.status === 'pending';
  }

  canNormalize(run: CatalogRun): boolean {
    return run.status === 'completed';
  }

  isActionBusy(runId: number, action: RowAction): boolean {
    return this.isSubmittingAction() && this.actionRunId() === runId && this.confirmAction() === action;
  }

  private queryParams(): RunsListQuery {
    return {
      page: this.page(),
      per_page: this.perPage(),
      supplier_id: this.supplierIdFilter(),
      status: this.statusFilter() || null,
      run_key: this.runKeyFilter().trim() || null,
    };
  }

  private showToast(type: 'success' | 'error', message: string): void {
    this.toast.set({ type, message });
    if (this.toastTimeoutId) clearTimeout(this.toastTimeoutId);
    this.toastTimeoutId = setTimeout(() => this.toast.set(null), 3200);
  }

  private syncAutoRefresh(runs: CatalogRun[]): void {
    const hasActive = runs.some(run => ['pending', 'init', 'loaded'].includes(run.status));
    if (hasActive) {
      this.startAutoRefresh();
    } else {
      this.stopAutoRefresh();
    }
  }

  private startAutoRefresh(): void {
    if (this.autoRefreshIntervalId) return;
    this.isAutoRefreshing.set(true);
    this.autoRefreshIntervalId = setInterval(() => this.refreshSilently(), this.autoRefreshMs);
  }

  private stopAutoRefresh(): void {
    if (this.autoRefreshIntervalId) {
      clearInterval(this.autoRefreshIntervalId);
      this.autoRefreshIntervalId = null;
    }
    this.isAutoRefreshing.set(false);
  }
}
