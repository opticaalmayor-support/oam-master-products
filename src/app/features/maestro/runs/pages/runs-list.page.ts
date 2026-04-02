import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription, finalize, forkJoin, map, of, switchMap } from 'rxjs';
import { RunStatusBadgeComponent } from '../components/run-status-badge.component';
import { CatalogRun, RunsListQuery } from '../models/run.model';
import { RunsApi } from '../services/runs.api';
import { RUN_STATUS_MAP } from '../utils/run-status-map';

type RowAction = 'start' | 'normalize';
type RunsViewMode = 'table' | 'calendar';

interface CalendarCell {
  key: string;
  date: Date;
  inCurrentMonth: boolean;
  isToday: boolean;
  runs: CatalogRun[];
  statusCounts: Array<{ status: string; label: string; count: number }>;
}

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
  readonly calendarRuns = signal<CatalogRun[]>([]);
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
  readonly viewMode = signal<RunsViewMode>('calendar');
  readonly calendarCursor = signal(this.startOfMonth(new Date()));
  readonly selectedDayKey = signal<string | null>(null);

  readonly statusOptions = computed(() => Object.entries(RUN_STATUS_MAP));
  readonly weekDayLabels = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
  readonly calendarTitle = computed(() =>
    new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(this.calendarCursor()),
  );
  readonly selectedDayRuns = computed(() => {
    const key = this.selectedDayKey();
    if (!key) return [];
    return this.calendarRuns().filter((run) => this.getRunDayKey(run) === key);
  });
  readonly calendarWeeks = computed<CalendarCell[][]>(() => this.buildCalendarWeeks(this.calendarCursor(), this.calendarRuns()));

  private autoRefreshIntervalId: ReturnType<typeof setInterval> | null = null;
  private readonly autoRefreshMs = 30000;
  private toastTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private loadRunsSubscription: Subscription | null = null;
  private loadSuppliersSubscription: Subscription | null = null;
  private silentRefreshSubscription: Subscription | null = null;
  private isSilentRefreshInFlight = false;

  ngOnInit(): void {
    this.loadSuppliers();
    if (this.viewMode() === 'calendar') {
      this.loadCalendarRuns();
    } else {
      this.loadRuns();
    }
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
    this.loadRunsSubscription?.unsubscribe();
    this.loadSuppliersSubscription?.unsubscribe();
    this.silentRefreshSubscription?.unsubscribe();
    if (this.toastTimeoutId) clearTimeout(this.toastTimeoutId);
  }

  loadRuns(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.loadRunsSubscription?.unsubscribe();
    this.loadRunsSubscription = this.api
      .getRuns(this.tableQueryParams())
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
    if (this.isSilentRefreshInFlight) return;
    this.isSilentRefreshInFlight = true;

    if (this.viewMode() === 'calendar') {
      this.refreshCalendarSilently();
      return;
    }

    this.silentRefreshSubscription?.unsubscribe();
    this.silentRefreshSubscription = this.api
      .getRuns(this.tableQueryParams())
      .pipe(
        finalize(() => {
          this.isSilentRefreshInFlight = false;
        }),
      )
      .subscribe({
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
    this.loadSuppliersSubscription?.unsubscribe();
    this.loadSuppliersSubscription = this.api.getSuppliers().subscribe({
      next: data => this.suppliers.set(data),
      error: () => this.suppliers.set([]),
    });
  }

  applyFilters(): void {
    this.page.set(1);
    if (this.viewMode() === 'calendar') {
      this.loadCalendarRuns();
    } else {
      this.loadRuns();
    }
  }

  clearFilters(): void {
    this.supplierIdFilter.set(null);
    this.statusFilter.set('');
    this.runKeyFilter.set('');
    this.page.set(1);
    if (this.viewMode() === 'calendar') {
      this.loadCalendarRuns();
    } else {
      this.loadRuns();
    }
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

  setViewMode(mode: RunsViewMode): void {
    if (this.viewMode() === mode) return;
    this.viewMode.set(mode);
    this.selectedDayKey.set(null);

    if (mode === 'calendar') {
      this.loadCalendarRuns();
    } else {
      this.loadRuns();
    }
  }

  goToPreviousMonth(): void {
    const current = this.calendarCursor();
    this.calendarCursor.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));
    this.selectedDayKey.set(null);
  }

  goToNextMonth(): void {
    const current = this.calendarCursor();
    this.calendarCursor.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));
    this.selectedDayKey.set(null);
  }

  goToCurrentMonth(): void {
    this.calendarCursor.set(this.startOfMonth(new Date()));
    this.selectedDayKey.set(null);
  }

  selectDay(dayKey: string): void {
    this.selectedDayKey.set(dayKey);
  }

  clearSelectedDay(): void {
    this.selectedDayKey.set(null);
  }

  getStatusClass(status: string): string {
    const meta = this.getStatusMeta(status);
    return meta?.badgeClass ?? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200';
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

  private tableQueryParams(): RunsListQuery {
    return {
      page: this.page(),
      per_page: this.perPage(),
      ...this.filtersQuery(),
    };
  }

  private calendarBaseQuery(): RunsListQuery {
    return {
      page: 1,
      per_page: 100,
      ...this.filtersQuery(),
    };
  }

  private filtersQuery(): RunsListQuery {
    return {
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
    this.silentRefreshSubscription?.unsubscribe();
    this.silentRefreshSubscription = null;
    this.isSilentRefreshInFlight = false;
    this.isAutoRefreshing.set(false);
  }

  private loadCalendarRuns(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.loadRunsSubscription?.unsubscribe();
    this.loadRunsSubscription = this.fetchAllRunsForCalendar()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => {
          this.calendarRuns.set(data);
          this.syncAutoRefresh(data);
        },
        error: (err) => {
          this.errorMessage.set(err?.error?.message ?? 'No se pudo cargar el calendario de runs.');
          this.calendarRuns.set([]);
          this.stopAutoRefresh();
        },
      });
  }

  private refreshCalendarSilently(): void {
    this.silentRefreshSubscription?.unsubscribe();
    this.silentRefreshSubscription = this.fetchAllRunsForCalendar()
      .pipe(
        finalize(() => {
          this.isSilentRefreshInFlight = false;
        }),
      )
      .subscribe({
        next: (data) => {
          this.calendarRuns.set(data);
          this.syncAutoRefresh(data);
        },
        error: () => {
          this.stopAutoRefresh();
        },
      });
  }

  private fetchAllRunsForCalendar() {
    const baseQuery = this.calendarBaseQuery();

    return this.api.getRuns(baseQuery).pipe(
      switchMap((firstPage) => {
        const pages = firstPage.pagination.last_page || 1;
        if (pages <= 1) return of(firstPage.data);

        const requests = Array.from({ length: pages - 1 }, (_, index) =>
          this.api.getRuns({ ...baseQuery, page: index + 2 }),
        );

        return forkJoin(requests).pipe(
          map((restPages) => [firstPage, ...restPages].flatMap((result) => result.data)),
        );
      }),
    );
  }

  private buildCalendarWeeks(cursor: Date, runs: CatalogRun[]): CalendarCell[][] {
    const currentMonth = cursor.getMonth();
    const groupedRuns = this.groupRunsByDay(runs);
    const todayKey = this.toDateKey(new Date());
    const start = this.startOfWeek(this.startOfMonth(cursor));
    const end = this.endOfWeek(this.endOfMonth(cursor));

    const weeks: CalendarCell[][] = [];
    let currentWeek: CalendarCell[] = [];
    let day = new Date(start);

    while (day <= end) {
      const dayKey = this.toDateKey(day);
      const dayRuns = groupedRuns.get(dayKey) ?? [];

      currentWeek.push({
        key: dayKey,
        date: new Date(day),
        inCurrentMonth: day.getMonth() === currentMonth,
        isToday: dayKey === todayKey,
        runs: dayRuns,
        statusCounts: this.getStatusCounts(dayRuns),
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      day = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
    }

    return weeks;
  }

  private groupRunsByDay(runs: CatalogRun[]): Map<string, CatalogRun[]> {
    const map = new Map<string, CatalogRun[]>();
    runs.forEach((run) => {
      const key = this.getRunDayKey(run);
      if (!key) return;
      const bucket = map.get(key);
      if (bucket) {
        bucket.push(run);
      } else {
        map.set(key, [run]);
      }
    });
    return map;
  }

  private getStatusCounts(runs: CatalogRun[]): Array<{ status: string; label: string; count: number }> {
    const map = new Map<string, number>();
    runs.forEach((run) => {
      const current = map.get(run.status) ?? 0;
      map.set(run.status, current + 1);
    });

    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([status, count]) => ({
        status,
        count,
        label: this.getStatusMeta(status)?.label ?? status,
      }));
  }

  private getStatusMeta(status: string) {
    return RUN_STATUS_MAP[status as keyof typeof RUN_STATUS_MAP];
  }

  private getRunDayKey(run: CatalogRun): string | null {
    const date = this.toValidDate(run.started_at ?? run.created_at);
    if (!date) return null;
    return this.toDateKey(date);
  }

  private toValidDate(value: string | null | undefined): Date | null {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private endOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }

  private startOfWeek(date: Date): Date {
    const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = copy.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    return new Date(copy.getFullYear(), copy.getMonth(), copy.getDate() + diff);
  }

  private endOfWeek(date: Date): Date {
    const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = copy.getDay();
    const diff = day === 0 ? 0 : 7 - day;
    return new Date(copy.getFullYear(), copy.getMonth(), copy.getDate() + diff);
  }
}
