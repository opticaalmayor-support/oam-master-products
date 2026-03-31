import { TestBed } from '@angular/core/testing';
import { NEVER, of, throwError } from 'rxjs';
import { RunNormalizedTableComponent } from './run-normalized-table.component';
import { RunsNormalizedService } from '../../services/runs-normalized.service';

describe('RunNormalizedTableComponent', () => {
  it('shows loading state while request is in progress', async () => {
    const mockService = {
      getNormalizedProducts: () => NEVER,
    } as unknown as RunsNormalizedService;

    await TestBed.configureTestingModule({
      imports: [RunNormalizedTableComponent],
      providers: [{ provide: RunsNormalizedService, useValue: mockService }],
    }).compileComponents();

    const fixture = TestBed.createComponent(RunNormalizedTableComponent);
    fixture.componentInstance.runId = 10;
    fixture.detectChanges();

    expect(fixture.componentInstance.isLoading()).toBeTruthy();
  });

  it('shows empty state when no rows returned', async () => {
    const mockService = {
      getNormalizedProducts: () =>
        of({
          run: { id: 10, run_key: 'RUN-10', status: 'completed' },
          data: [],
          pagination: { current_page: 1, per_page: 25, total: 0, last_page: 1 },
        }),
    } as unknown as RunsNormalizedService;

    await TestBed.configureTestingModule({
      imports: [RunNormalizedTableComponent],
      providers: [{ provide: RunsNormalizedService, useValue: mockService }],
    }).compileComponents();

    const fixture = TestBed.createComponent(RunNormalizedTableComponent);
    fixture.componentInstance.runId = 10;
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text.includes('No hay productos normalized')).toBeTruthy();
  });

  it('shows error state when request fails', async () => {
    const mockService = {
      getNormalizedProducts: () => throwError(() => ({ error: { message: 'boom' } })),
    } as unknown as RunsNormalizedService;

    await TestBed.configureTestingModule({
      imports: [RunNormalizedTableComponent],
      providers: [{ provide: RunsNormalizedService, useValue: mockService }],
    }).compileComponents();

    const fixture = TestBed.createComponent(RunNormalizedTableComponent);
    fixture.componentInstance.runId = 10;
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text.includes('boom')).toBeTruthy();
  });

  it('renders normalized rows', async () => {
    const mockService = {
      getNormalizedProducts: () =>
        of({
          run: { id: 10, run_key: 'RUN-10', status: 'completed' },
          data: [
            {
              id: 1,
              run_id: 10,
              raw_id: 9,
              oam_key: 'OAM-1',
              product_family: 'SUN',
              brand_name: 'ACME',
              model_code: null,
              color_code: null,
              size_lens: null,
              size_bridge: null,
              size_temple: null,
              size_std: null,
              supplier_sku: 'SKU-1',
              upc: null,
              cost: null,
              currency: null,
              available_qty: null,
              valid_state: 'ok',
              quality_score: 88,
              media: { primary_image_signed_url: null, gallery_signed_urls: [] },
              extra_attributes: null,
              normalization_log: null,
              created_at: '2026-01-01 00:00:00',
              updated_at: '2026-01-01 00:00:00',
            },
          ],
          pagination: { current_page: 1, per_page: 25, total: 1, last_page: 1 },
        }),
    } as unknown as RunsNormalizedService;

    await TestBed.configureTestingModule({
      imports: [RunNormalizedTableComponent],
      providers: [{ provide: RunsNormalizedService, useValue: mockService }],
    }).compileComponents();

    const fixture = TestBed.createComponent(RunNormalizedTableComponent);
    fixture.componentInstance.runId = 10;
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text.includes('OAM-1')).toBeTruthy();
  });
});
