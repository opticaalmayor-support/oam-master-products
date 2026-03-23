import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { getApiUrl } from '../../../../core/config/api.config';
import {
  NywdLatestRunResult,
  NywdProductItem,
  NywdProductsResult,
  normalizeNywdLatestRun,
  normalizeNywdProductDetail,
  normalizeNywdProductsResponse,
} from '../models/nywd-product.model';

export interface NywdProductsQuery {
  supplier_id: number;
  run_id?: number;
  page: number;
  per_page: number;
  search: string;
}

@Injectable({ providedIn: 'root' })
export class NywdProductsApi {
  private static readonly MAX_PER_PAGE = 25;

  private readonly http = inject(HttpClient);
  private readonly latestRunUrl = getApiUrl('nywdLatestRun');
  private readonly productsUrl = getApiUrl('nywdProducts');

  getLatestRun(supplierId: number): Observable<NywdLatestRunResult> {
    const params = new HttpParams().set('supplier_id', String(supplierId));

    return this.http
      .get<unknown>(this.latestRunUrl, { params })
      .pipe(map((response) => normalizeNywdLatestRun(response)));
  }

  getProducts(query: NywdProductsQuery): Observable<NywdProductsResult> {
    const supplierId = Math.max(1, Math.trunc(query.supplier_id));
    const page = Math.max(1, Math.trunc(query.page));
    const perPage = Math.min(NywdProductsApi.MAX_PER_PAGE, Math.max(1, Math.trunc(query.per_page)));
    const search = query.search.trim();

    let params = new HttpParams()
      .set('supplier_id', String(supplierId))
      .set('page', String(page))
      .set('per_page', String(perPage));

    if (typeof query.run_id === 'number' && Number.isFinite(query.run_id) && query.run_id > 0) {
      params = params.set('run_id', String(Math.trunc(query.run_id)));
    }

    if (search.length > 0) {
      params = params.set('search', search);
    }

    return this.http
      .get<unknown>(this.productsUrl, { params })
      .pipe(map((response) => normalizeNywdProductsResponse(response)));
  }

  getProductDetail(rawId: number): Observable<NywdProductItem | null> {
    return this.http
      .get<unknown>(getApiUrl('nywdProductDetail', { rawId }))
      .pipe(map((response) => normalizeNywdProductDetail(response)));
  }
}
