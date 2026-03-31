import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NEVER, of } from 'rxjs';
import { SupplierApiRunTesterComponent } from './supplier-api-run-tester.component';
import { RunsApi } from '../../../maestro/runs/services/runs.api';
import { SupplierSettingsApi } from '../../../suppliers/services/supplier-settings.api';
import { SupplierRunsService } from '../../services/supplier-runs.service';

describe('SupplierApiRunTesterComponent', () => {
  let startApiRunCalls = 0;

  const runsApiMock = {
    getSuppliers: () => of([]),
  };

  const supplierSettingsApiMock = {
    getSettings: () =>
      of({
        api: {
          base_url: '',
          timeout_seconds: 30,
          auth: { type: 'none' },
          endpoints: {
            testing_products: {
              method: 'GET',
              path: '/api/v1/products',
              purpose: 'testing',
              query_map: {
                'request.page': '$.page',
                'request.pageSize': '$.page_size',
                'request.maxPages': '$.max_pages',
              },
              headers: {},
            },
          },
          mapping: {},
        },
        schedule: {
          enabled: false,
          timezone: 'America/New_York',
          windows: [],
        },
      }),
  };

  const supplierRunsServiceMock = {
    startApiRun: () => {
      startApiRunCalls += 1;
      return NEVER;
    },
  };

  beforeEach(async () => {
    startApiRunCalls = 0;

    await TestBed.configureTestingModule({
      imports: [SupplierApiRunTesterComponent],
      providers: [
        provideRouter([]),
        { provide: RunsApi, useValue: runsApiMock as unknown as RunsApi },
        { provide: SupplierSettingsApi, useValue: supplierSettingsApiMock as unknown as SupplierSettingsApi },
        { provide: SupplierRunsService, useValue: supplierRunsServiceMock as unknown as SupplierRunsService },
      ],
    }).compileComponents();
  });

  it('keeps submit disabled when supplier is missing', () => {
    const fixture = TestBed.createComponent(SupplierApiRunTesterComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component.form.valid).toBeFalsy();

    const button = fixture.nativeElement.querySelector('[data-testid="run-test-btn"]') as HTMLButtonElement;
    expect(button.disabled).toBeTruthy();
  });

  it('disables form while request is running', () => {
    const fixture = TestBed.createComponent(SupplierApiRunTesterComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.form.patchValue({ supplierId: 7 });
    component.runTestApi();

    expect(component.isSubmitting()).toBeTruthy();
    expect(component.form.disabled).toBeTruthy();
    expect(startApiRunCalls).toBe(1);
  });
});
