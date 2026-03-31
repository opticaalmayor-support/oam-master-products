import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { getApiUrl } from '../../../core/config/api.config';
import { StartApiRunRequest, StartApiRunResponse } from '../models/supplier-runs.models';

@Injectable({ providedIn: 'root' })
export class SupplierRunsService {
  private readonly http = inject(HttpClient);
  private readonly suppliersUrl = getApiUrl('suppliers');

  startApiRun(supplierId: number, payload: StartApiRunRequest): Observable<StartApiRunResponse> {
    return this.http.post<StartApiRunResponse>(`${this.suppliersUrl}/${supplierId}/runs/api/start`, payload);
  }
}
