import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { RunsNormalizedService } from './runs-normalized.service';

describe('RunsNormalizedService', () => {
  let service: RunsNormalizedService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RunsNormalizedService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(RunsNormalizedService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('maps normalized-products response', () => {
    let receivedTotal = 0;
    let receivedKey = '';

    service
      .getNormalizedProducts(10, { page: 1, per_page: 25, search: '' })
      .subscribe((result) => {
        receivedTotal = result.pagination.total;
        receivedKey = result.data[0]?.oam_key ?? '';
      });

    const req = httpMock.expectOne(
      'http://new-api.test/api/maestro/runs/catalog/10/normalized-products?page=1&per_page=25&search=',
    );
    expect(req.request.method).toBe('GET');

    req.flush({
      run: { id: 10, run_key: 'RUN-10', status: 'completed' },
      products: {
        data: [
          {
            id: 1,
            run_id: 10,
            raw_id: 9,
            oam_key: 'OAM-1',
            product_family: 'SUN',
            valid_state: 'ok',
            quality_score: 90,
            created_at: '2026-01-01 00:00:00',
            updated_at: '2026-01-01 00:00:00',
          },
        ],
        current_page: 1,
        per_page: 25,
        total: 1,
        last_page: 1,
      },
    });

    expect(receivedTotal).toBe(1);
    expect(receivedKey).toBe('OAM-1');
  });
});
