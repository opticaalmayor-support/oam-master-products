import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, Input, OnChanges, OnInit, SimpleChanges, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, distinctUntilChanged, finalize, of, Subject, switchMap, tap } from 'rxjs';
import { CatalogRun } from '../../../maestro/runs/models/run.model';
import { NormalizedItem, NormalizedProductsPagination, NormalizedProductsResult } from '../../models/run-normalized.models';
import { RunsNormalizedService } from '../../services/runs-normalized.service';

@Component({
  selector: 'app-run-normalized-table',
  standalone: true,
  imports: [CommonModule, DatePipe, DecimalPipe],
  templateUrl: './run-normalized-table.component.html',
  styleUrl: './run-normalized-table.component.scss',
})
export class RunNormalizedTableComponent implements OnInit, OnChanges {
  private readonly api = inject(RunsNormalizedService);
  private readonly destroyRef = inject(DestroyRef);

  @Input({ required: true }) runId = 0;
  @Input() runSummary: CatalogRun | null = null;

  readonly items = signal<NormalizedItem[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly search = signal('');
  readonly searchDraft = signal('');
  readonly pagination = signal<NormalizedProductsPagination>({
    current_page: 1,
    per_page: 25,
    total: 0,
    last_page: 1,
  });

  readonly selectedItem = signal<NormalizedItem | null>(null);
  readonly isDetailOpen = signal(false);

  readonly runHeader = computed(() => ({
    id: this.runSummary?.id ?? this.runId,
    runKey: this.runSummary?.run_key ?? '-',
    supplier: this.runSummary?.oam_supplier
      ? `${this.runSummary.oam_supplier.code} / ${this.runSummary.oam_supplier.name}`
      : '-',
    normalizedCount: this.runSummary?.oam_product_normalizeds_count ?? this.pagination().total,
  }));

  readonly pageSizes = [10, 25, 50, 100];
  private readonly searchInput$ = new Subject<string>();
  private readonly reload$ = new Subject<void>();

  ngOnInit(): void {
    this.searchInput$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap((term) => {
          this.search.set(term.trim());
          this.pagination.update((state) => ({ ...state, current_page: 1 }));
          this.reload$.next();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    this.reload$
      .pipe(
        tap(() => {
          if (!this.runId) return;
          this.isLoading.set(true);
          this.errorMessage.set(null);
        }),
        switchMap(() => {
          if (!this.runId) return of<NormalizedProductsResult | null>(null);

          const pagination = this.pagination();
          return this.api
            .getNormalizedProducts(this.runId, {
              page: pagination.current_page,
              per_page: pagination.per_page,
              search: this.search(),
            })
            .pipe(
              catchError((err) => {
                this.items.set([]);
                this.errorMessage.set(err?.error?.message ?? 'No se pudieron cargar los productos normalized.');
                return of<NormalizedProductsResult | null>(null);
              }),
              finalize(() => this.isLoading.set(false)),
            );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        if (!result) return;
        this.items.set(result.data);
        this.pagination.set(result.pagination);
      });

    this.reload();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['runId'] && !changes['runId'].firstChange) {
      this.search.set('');
      this.searchDraft.set('');
      this.pagination.set({ current_page: 1, per_page: 25, total: 0, last_page: 1 });
      this.closeDetail();
      this.reload();
    }
  }

  onSearchInput(value: string): void {
    this.searchDraft.set(value);
    this.searchInput$.next(value);
  }

  onPerPageChange(value: string): void {
    const parsed = Number(value);
    this.pagination.update((state) => ({
      ...state,
      per_page: Number.isFinite(parsed) && parsed > 0 ? parsed : state.per_page,
      current_page: 1,
    }));
    this.reload();
  }

  prevPage(): void {
    const current = this.pagination().current_page;
    if (current <= 1) return;
    this.pagination.update((state) => ({ ...state, current_page: state.current_page - 1 }));
    this.reload();
  }

  nextPage(): void {
    const current = this.pagination().current_page;
    const last = this.pagination().last_page;
    if (current >= last) return;
    this.pagination.update((state) => ({ ...state, current_page: state.current_page + 1 }));
    this.reload();
  }

  reload(): void {
    this.reload$.next();
  }

  openDetail(item: NormalizedItem): void {
    this.selectedItem.set(item);
    this.isDetailOpen.set(true);
  }

  closeDetail(): void {
    this.selectedItem.set(null);
    this.isDetailOpen.set(false);
  }

  validStateClass(validState: string): string {
    return validState.toLowerCase() === 'ok'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
  }

  qualityClass(score: number): string {
    if (score >= 80) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
    if (score >= 50) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
    return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src =
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="100%" height="100%" fill="%23e5e7eb"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%236b7280" font-size="10">No image</text></svg>';
  }

  formatJson(value: unknown): string {
    try {
      return JSON.stringify(value ?? null, null, 2);
    } catch {
      return String(value);
    }
  }
}
