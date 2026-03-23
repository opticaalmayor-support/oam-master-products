import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NywdProductItem, NywdProductsPagination } from '../models/nywd-product.model';
import { NywdProductsApi } from '../services/nywd-products.api';

@Component({
  selector: 'app-nywd-products-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './nywd-products.page.html',
  styleUrl: './nywd-products.page.scss',
})
export class NywdProductsPage implements OnInit {
  private readonly api = inject(NywdProductsApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  private readonly supplierId = 3;
  private readonly perPage = 25;

  readonly runId = signal<number | null>(null);
  readonly products = signal<NywdProductItem[]>([]);
  readonly pagination = signal<NywdProductsPagination>({
    current_page: 1,
    last_page: 1,
    per_page: this.perPage,
    total: 0,
  });

  readonly searchDraft = signal('');
  readonly currentSearch = signal('');

  readonly isLoadingProducts = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly selectedDetail = signal<NywdProductItem | null>(null);
  readonly isDetailOpen = signal(false);
  readonly isLoadingDetail = signal(false);
  readonly detailError = signal<string | null>(null);

  private productsRequestId = 0;
  private detailRequestId = 0;

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const page = this.parsePageParam(params.get('page'));
        const search = (params.get('search') ?? '').trim();

        this.searchDraft.set(search);
        this.currentSearch.set(search);
        this.loadProducts(page, search);
      });
  }

  retry(): void {
    this.loadProducts(this.pagination().current_page, this.currentSearch());
  }

  search(): void {
    const search = this.searchDraft().trim();
    this.updateQueryParams({ page: 1, search });
  }

  clearSearch(): void {
    this.searchDraft.set('');
    this.updateQueryParams({ page: 1, search: null });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.pagination().last_page || page === this.pagination().current_page) {
      return;
    }

    this.updateQueryParams({ page });
  }

  openDetail(product: NywdProductItem): void {
    const requestId = ++this.detailRequestId;

    this.isDetailOpen.set(true);
    this.selectedDetail.set(product);
    this.isLoadingDetail.set(true);
    this.detailError.set(null);

    this.api
      .getProductDetail(product.raw_id)
      .pipe(
        finalize(() => {
          if (requestId === this.detailRequestId) {
            this.isLoadingDetail.set(false);
          }
        }),
      )
      .subscribe({
        next: (detail) => {
          if (requestId !== this.detailRequestId) {
            return;
          }

          if (detail) {
            this.selectedDetail.set(detail);
          }
        },
        error: (error: unknown) => {
          if (requestId !== this.detailRequestId) {
            return;
          }
          this.detailError.set(this.resolveErrorMessage(error, 'detail'));
        },
      });
  }

  closeDetail(): void {
    this.detailRequestId += 1;
    this.isDetailOpen.set(false);
    this.selectedDetail.set(null);
    this.isLoadingDetail.set(false);
    this.detailError.set(null);
  }

  trackByRawId(_: number, item: NywdProductItem): number {
    return item.raw_id;
  }

  private loadProducts(page: number, search: string): void {
    const requestId = ++this.productsRequestId;

    this.isLoadingProducts.set(true);
    this.errorMessage.set(null);

    this.api
      .getProducts({
        supplier_id: this.supplierId,
        page,
        per_page: this.perPage,
        search,
      })
      .pipe(
        finalize(() => {
          if (requestId === this.productsRequestId) {
            this.isLoadingProducts.set(false);
          }
        }),
      )
      .subscribe({
        next: (result) => {
          if (requestId !== this.productsRequestId) {
            return;
          }

          this.runId.set(result.run?.id ? Number(result.run.id) : null);
          this.products.set(result.data);
          this.pagination.set({
            current_page: result.pagination.current_page,
            last_page: result.pagination.last_page,
            per_page: this.perPage,
            total: result.pagination.total,
          });
        },
        error: (error: unknown) => {
          if (requestId !== this.productsRequestId) {
            return;
          }
          this.errorMessage.set(this.resolveErrorMessage(error, 'products'));
        },
      });
  }

  private resolveErrorMessage(error: unknown, context: 'products' | 'detail'): string {
    const status = this.getStatusFromError(error);

    if (status === 401) {
      void this.router.navigate(['/login'], { queryParams: { redirect: '/nywd' } });
      return 'Sesion expirada. Redirigiendo a login...';
    }

    if (status === 404 && context === 'products') {
      return 'Aun no hay una corrida NYWD disponible para este supplier.';
    }

    if (status === 422) {
      return 'Parametros invalidos para consultar catalogo NYWD.';
    }

    if (status === 500) {
      return 'Error interno del servidor. Intenta nuevamente en unos segundos.';
    }

    const fallback = this.getMessageFromError(error);
    if (fallback) {
      return fallback;
    }

    switch (context) {
      case 'detail':
        return 'No se pudo cargar el detalle del producto.';
      default:
        return 'No se pudo cargar el catalogo NYWD.';
    }
  }

  private getStatusFromError(error: unknown): number | null {
    if (!error || typeof error !== 'object') {
      return null;
    }

    const src = error as Record<string, unknown>;
    if (typeof src['status'] === 'number') {
      return src['status'];
    }

    const originalError = src['originalError'];
    if (originalError && typeof originalError === 'object') {
      const originalStatus = (originalError as Record<string, unknown>)['status'];
      if (typeof originalStatus === 'number') {
        return originalStatus;
      }
    }

    return null;
  }

  private getMessageFromError(error: unknown): string | null {
    if (!error || typeof error !== 'object') {
      return null;
    }

    const src = error as Record<string, unknown>;
    if (typeof src['message'] === 'string' && src['message'].trim().length > 0) {
      return src['message'];
    }

    return null;
  }

  private updateQueryParams(params: { page?: number; search?: string | null }): void {
    const currentPage = this.pagination().current_page;
    const currentSearch = this.currentSearch();
    const nextPage = params.page ?? currentPage;
    const nextSearch = params.search === undefined ? currentSearch : params.search;
    const normalizedSearch = nextSearch && nextSearch.length > 0 ? nextSearch : null;

    const currentPageParam = this.parsePageParam(this.route.snapshot.queryParamMap.get('page'));
    const currentSearchParam = (this.route.snapshot.queryParamMap.get('search') ?? '').trim();
    const currentNormalizedSearch = currentSearchParam.length > 0 ? currentSearchParam : null;

    if (currentPageParam === nextPage && currentNormalizedSearch === normalizedSearch) {
      return;
    }

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        page: nextPage,
        search: normalizedSearch,
      },
      queryParamsHandling: 'merge',
    });
  }

  private parsePageParam(rawPage: string | null): number {
    const parsed = Number(rawPage);
    if (!Number.isFinite(parsed) || parsed < 1) {
      return 1;
    }

    return Math.trunc(parsed);
  }
}
