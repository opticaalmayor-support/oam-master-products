import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { getApiUrl } from '../../../core/config/api.config';
import {
  NormalizedProductsQuery,
  NormalizedProductsResult,
  normalizeNormalizedProductsResponse,
} from '../models/run-normalized.models';

interface LaravelNormalizedResponse {
  run?: unknown;
  products?: {
    data?: unknown[];
    current_page?: number;
    per_page?: number;
    total?: number;
    last_page?: number;
  };
}

@Injectable({ providedIn: 'root' })
export class RunsNormalizedService {
  private readonly http = inject(HttpClient);
  private readonly runsUrl = getApiUrl('catalogRuns');

  getNormalizedProducts(runId: number, query: NormalizedProductsQuery): Observable<NormalizedProductsResult> {
    let params = new HttpParams();
    params = params.set('page', String(query.page));
    params = params.set('per_page', String(query.per_page));
    params = params.set('search', query.search ?? '');

    return this.http
      .get<LaravelNormalizedResponse>(`${this.runsUrl}/${runId}/normalized-products`, { params })
      .pipe(map((response) => normalizeNormalizedProductsResponse(response, query)));
  }
}
