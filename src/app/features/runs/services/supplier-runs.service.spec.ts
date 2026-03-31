import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { SupplierRunsService } from './supplier-runs.service';
import { StartApiRunRequest, StartApiRunResponse } from '../models/supplier-runs.models';

describe('SupplierRunsService', () => {
  let service: SupplierRunsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SupplierRunsService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(SupplierRunsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('posts start api run payload to supplier endpoint', () => {
    const supplierId = 12;
    const payload: StartApiRunRequest = {
      purpose: 'testing',
      request: {
        page: 1,
        pageSize: 25,
        max_pages: 2,
        brandName: 'Acme',
        categoryId: '10',
        filters: {
          brand_name: 'Acme',
          category_id: '10',
        },
      },
      notes: 'smoke',
    };

    const response: StartApiRunResponse = {
      ok: true,
      run: { id: 99, status: 'processing' },
      stats: {
        fetched: 20,
        mapped: 20,
        inserted: 15,
        skipped_existing: 5,
        errors: 0,
        pages_processed: 1,
        total_count: 20,
      },
    };

    let actual: StartApiRunResponse | null = null;
    service.startApiRun(supplierId, payload).subscribe((res) => {
      actual = res;
    });

    const req = httpMock.expectOne('http://new-api.test/api/maestro/suppliers/12/runs/api/start');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(response);

    expect(actual).toEqual(response);
  });
});
