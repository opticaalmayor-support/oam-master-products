import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EMPTY, catchError, finalize } from 'rxjs';
import { RunsApi } from '../../../maestro/runs/services/runs.api';
import { SupplierSettingsApi } from '../../../suppliers/services/supplier-settings.api';
import { StartApiRunRequest, StartApiRunResponse } from '../../models/supplier-runs.models';
import { SupplierRunsService } from '../../services/supplier-runs.service';

interface SupplierOption {
  id: number;
  name: string;
  code: string;
}

interface ApiRunErrorState {
  status: number;
  message: string;
  errorCode: string | null;
  payload: string;
  firstSample: string | null;
}

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200, 500] as const;

@Component({
  selector: 'app-supplier-api-run-tester',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './supplier-api-run-tester.component.html',
  styleUrl: './supplier-api-run-tester.component.scss',
})
export class SupplierApiRunTesterComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly runsApi = inject(RunsApi);
  private readonly supplierSettingsApi = inject(SupplierSettingsApi);
  private readonly supplierRunsApi = inject(SupplierRunsService);

  readonly suppliers = signal<SupplierOption[]>([]);
  readonly isLoadingSuppliers = signal(false);
  readonly isLoadingSettings = signal(false);
  readonly selectedEndpointKey = signal<string | null>(null);
  readonly endpointValidationMessage = signal<string | null>(null);

  readonly isSubmitting = signal(false);
  readonly runResult = signal<StartApiRunResponse | null>(null);
  readonly runError = signal<ApiRunErrorState | null>(null);

  readonly form = this.fb.group({
    supplierId: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
    purpose: this.fb.nonNullable.control<'run' | 'testing'>('testing', [Validators.required]),
    page: this.fb.nonNullable.control(1, [Validators.required, Validators.min(1)]),
    pageSize: this.fb.nonNullable.control<(typeof PAGE_SIZE_OPTIONS)[number]>(25, [Validators.required]),
    max_pages: this.fb.nonNullable.control(2, [Validators.required, Validators.min(1)]),
    brandName: this.fb.control<string>(''),
    categoryId: this.fb.control<string>(''),
    notes: this.fb.control<string>(''),
  });

  readonly canSubmit = computed(() => {
    if (this.isSubmitting()) return false;
    if (this.endpointValidationMessage()) return false;
    if (!this.selectedEndpointKey()) return false;
    return this.form.valid;
  });

  readonly submitDisabledReason = computed(() => {
    if (this.isSubmitting()) return 'Ejecutando prueba...';
    if (this.endpointValidationMessage()) return this.endpointValidationMessage();
    if (!this.selectedEndpointKey()) return 'Selecciona proveedor y purpose valido.';
    if (!this.form.valid) return 'Completa los campos requeridos.';
    return null;
  });

  readonly resultBadgeClass = computed(() => {
    const result = this.runResult();
    if (!result) return '';
    return result.ok
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
      : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300';
  });

  ngOnInit(): void {
    this.loadSuppliers();

    this.form.controls.supplierId.valueChanges.subscribe(() => this.validateSelectedEndpoint());
    this.form.controls.purpose.valueChanges.subscribe(() => this.validateSelectedEndpoint());
  }

  runTestApi(): void {
    this.form.markAllAsTouched();
    if (!this.canSubmit()) return;

    const supplierId = this.form.controls.supplierId.value;
    if (!supplierId || supplierId <= 0) return;

    this.isSubmitting.set(true);
    this.form.disable({ emitEvent: false });
    this.runResult.set(null);
    this.runError.set(null);

    this.supplierRunsApi
      .startApiRun(supplierId, this.buildRequestPayload())
      .pipe(
        catchError((err: HttpErrorResponse) => {
          const body = err.error as Record<string, unknown> | string | null;
          const message = this.resolveErrorMessage(body, err);
          const errorCode =
            body && typeof body === 'object' && typeof body['error_code'] === 'string'
              ? body['error_code']
              : null;
          const firstSample = this.resolveFirstErrorSample(body);

          this.runError.set({
            status: err.status,
            message,
            errorCode,
            payload: this.stringifyPayload(body),
            firstSample,
          });
          return EMPTY;
        }),
        finalize(() => {
          this.isSubmitting.set(false);
          this.form.enable({ emitEvent: false });
        }),
      )
      .subscribe((result) => {
        this.runResult.set(result);
      });
  }

  retry(): void {
    this.runTestApi();
  }

  formatEndpointExecution(item: string | Record<string, unknown>): string {
    if (typeof item === 'string') {
      return item;
    }

    const endpointKey = this.pickString(item, ['endpoint_key', 'endpoint', 'key', 'name']);
    const status = this.pickString(item, ['status', 'result']);
    const page = this.pickNumber(item, ['page']);

    const parts: string[] = [];
    if (endpointKey) parts.push(endpointKey);
    if (status) parts.push(status);
    if (typeof page === 'number') parts.push(`page ${page}`);

    if (parts.length > 0) {
      return parts.join(' · ');
    }

    return JSON.stringify(item);
  }

  private loadSuppliers(): void {
    this.isLoadingSuppliers.set(true);

    this.runsApi
      .getSuppliers()
      .pipe(finalize(() => this.isLoadingSuppliers.set(false)))
      .subscribe({
        next: (data) => {
          this.suppliers.set(data.map((item) => ({ id: item.id, name: item.name, code: item.code })));
        },
        error: () => {
          this.suppliers.set([]);
        },
      });
  }

  private validateSelectedEndpoint(): void {
    const supplierId = this.form.controls.supplierId.value;
    const purpose = this.form.controls.purpose.value;

    this.runResult.set(null);
    this.runError.set(null);

    if (!supplierId || supplierId <= 0) {
      this.selectedEndpointKey.set(null);
      this.endpointValidationMessage.set(null);
      return;
    }

    this.isLoadingSettings.set(true);

    this.supplierSettingsApi
      .getSettings(supplierId)
      .pipe(finalize(() => this.isLoadingSettings.set(false)))
      .subscribe({
        next: (settings) => {
          const candidates = Object.entries(settings.api.endpoints)
            .filter(([, endpoint]) => (endpoint.purpose ?? 'none') === purpose && endpoint.enabled !== false)
            .sort((a, b) => Number(a[1].priority ?? 100) - Number(b[1].priority ?? 100));

          if (candidates.length === 0) {
            this.selectedEndpointKey.set(null);
            this.endpointValidationMessage.set(
              `Este proveedor no tiene endpoint habilitado con purpose ${purpose}. Configuralo en Supplier Settings.`,
            );
            return;
          }

          this.selectedEndpointKey.set(candidates[0][0]);
          this.endpointValidationMessage.set(null);
        },
        error: () => {
          this.selectedEndpointKey.set(null);
          this.endpointValidationMessage.set('No se pudo validar endpoint para este proveedor.');
        },
      });
  }

  private buildRequestPayload(): StartApiRunRequest {
    const formValue = this.form.getRawValue();
    const brandName = formValue.brandName?.trim() || null;
    const categoryId = formValue.categoryId?.trim() || null;
    const notes = formValue.notes?.trim() || null;

    return {
      purpose: formValue.purpose,
      request: {
        page: Number(formValue.page),
        pageSize: Number(formValue.pageSize),
        max_pages: Number(formValue.max_pages),
        brandName,
        categoryId,
        filters: {
          brand_name: brandName,
          category_id: categoryId,
        },
      },
      notes,
    };
  }

  private resolveErrorMessage(body: Record<string, unknown> | string | null, err: HttpErrorResponse): string {
    if (typeof body === 'string' && body.trim()) return body;
    if (body && typeof body === 'object') {
      const message = body['message'];
      if (typeof message === 'string' && message.trim()) return message;
      const error = body['error'];
      if (typeof error === 'string' && error.trim()) return error;
    }
    return err.message || 'No se pudo iniciar la corrida API.';
  }

  private resolveFirstErrorSample(body: Record<string, unknown> | string | null): string | null {
    if (!body || typeof body !== 'object') return null;
    const stats = body['stats'];
    if (!stats || typeof stats !== 'object') return null;
    const samples = (stats as Record<string, unknown>)['error_samples'];
    if (!Array.isArray(samples) || samples.length === 0) return null;
    const first = samples[0];
    return typeof first === 'string' ? first : JSON.stringify(first);
  }

  private stringifyPayload(payload: Record<string, unknown> | string | null): string {
    if (typeof payload === 'string') return payload;
    if (!payload) return '{}';
    return JSON.stringify(payload, null, 2);
  }

  private pickString(item: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      const value = item[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return null;
  }

  private pickNumber(item: Record<string, unknown>, keys: string[]): number | null {
    for (const key of keys) {
      const value = item[key];
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
    }

    return null;
  }
}
