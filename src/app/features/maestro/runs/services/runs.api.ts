import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { getApiUrl } from '../../../../core/config/api.config';
import {
  CatalogRun,
  LaravelPaginatedResponse,
  RunsListQuery,
  RunsListResult,
  normalizeRunStats,
} from '../models/run.model';
import {
  LaravelRawProductsResponse,
  RawProductsQuery,
  RawProductsResult,
  normalizeRawProduct,
} from '../models/raw-product.model';

interface SupplierApi {
  id: number;
  name: string;
  code: string;
  is_active?: boolean;
}

@Injectable({ providedIn: 'root' })
export class RunsApi {
  private readonly http = inject(HttpClient);
  private readonly runsUrl = getApiUrl('catalogRuns');
  private readonly suppliersUrl = getApiUrl('suppliers');

  getRuns(query: RunsListQuery): Observable<RunsListResult> {
    let params = new HttpParams();

    if (query.page) params = params.set('page', String(query.page));
    if (query.per_page) params = params.set('per_page', String(query.per_page));
    if (query.supplier_id) params = params.set('supplier_id', String(query.supplier_id));
    if (query.status) params = params.set('status', query.status);
    if (query.run_key) params = params.set('run_key', query.run_key);

    return this.http
      .get<LaravelPaginatedResponse<CatalogRun> | CatalogRun[]>(this.runsUrl, { params })
      .pipe(
        map((res): RunsListResult => {
          if (Array.isArray(res)) {
            return {
              data: res.map(run => this.adaptRun(run)),
              pagination: {
                current_page: 1,
                last_page: 1,
                per_page: res.length,
                total: res.length,
              },
            };
          }

          return {
            data: (res.data ?? []).map(run => this.adaptRun(run)),
            pagination: {
              current_page: res.current_page ?? 1,
              last_page: res.last_page ?? 1,
              per_page: Number(res.per_page ?? query.per_page ?? 25),
              total: Number(res.total ?? 0),
            },
          };
        }),
      );
  }

  getRun(runId: number): Observable<CatalogRun> {
    return this.http
      .get<CatalogRun>(`${this.runsUrl}/${runId}`)
      .pipe(map(run => this.adaptRun(run)));
  }

  startRun(runId: number): Observable<CatalogRun> {
    return this.http
      .post<CatalogRun>(`${this.runsUrl}/${runId}/start`, {})
      .pipe(map(run => this.adaptRun(run)));
  }

  normalizeRun(runId: number): Observable<CatalogRun> {
    return this.http
      .post<CatalogRun>(`${this.runsUrl}/${runId}/normalize`, {})
      .pipe(map(run => this.adaptRun(run)));
  }

  getSuppliers(): Observable<SupplierApi[]> {
    return this.http
      .get<{ data: SupplierApi[] } | SupplierApi[]>(this.suppliersUrl)
      .pipe(
        map(res => {
          const suppliers = Array.isArray(res) ? res : (res.data ?? []);
          return suppliers.filter(s => s.is_active !== false);
        }),
      );
  }

  getRawProducts(runId: number, query: RawProductsQuery): Observable<RawProductsResult> {
    let params = new HttpParams();
    params = params.set('page', String(query.page));
    params = params.set('per_page', String(query.per_page));
    if (query.search) params = params.set('search', query.search);

    return this.http
      .get<LaravelRawProductsResponse>(`${this.runsUrl}/${runId}/raw-products`, { params })
      .pipe(
        map((res): RawProductsResult => {
          const products = res.products ?? {};

          return {
            run: res.run ? this.adaptRun(res.run) : undefined,
            data: (products.data ?? []).map(item => normalizeRawProduct(item)),
            pagination: {
              current_page: Number(products.current_page ?? query.page ?? 1),
              last_page: Number(products.last_page ?? 1),
              per_page: Number(products.per_page ?? query.per_page ?? 25),
              total: Number(products.total ?? 0),
            },
          };
        }),
      );
  }

  private adaptRun(run: CatalogRun): CatalogRun {
    const toNumber = (value: unknown): number => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    return {
      ...run,
      stats: normalizeRunStats(run?.stats),
      oam_supplier_product_raws_count: toNumber(run?.oam_supplier_product_raws_count),
      oam_product_normalizeds_count: toNumber(run?.oam_product_normalizeds_count),
    };
  }
}
