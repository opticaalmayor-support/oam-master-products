import { Injectable, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { SupplierSettingsApi } from './supplier-settings.api';
import {
  HttpMethod,
  SupplierApiAuthSettings,
  SupplierApiEndpoint,
  SupplierScheduleDay,
  SupplierScheduleSettings,
  SupplierScheduleWindow,
  SupplierSettings,
  SupplierSettingsFieldErrors,
  SupplierSettingsPatchPayload,
  SupplierSettingsSchema,
} from '../models/supplier-settings.model';

const SCHEDULE_DAYS: SupplierScheduleDay[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];
const TIME_24H_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DEFAULT_SCHEDULE_TIMEZONE = 'America/New_York';
const DEFAULT_MAX_LAG_MINUTES = 15;
const DEFAULT_JITTER_SECONDS = 10;

@Injectable({ providedIn: 'root' })
export class SupplierSettingsStore {
  private readonly api = inject(SupplierSettingsApi);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly fieldErrors = signal<SupplierSettingsFieldErrors>({});
  readonly schema = signal<SupplierSettingsSchema>({
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    mapping: { local_raw_fields: [], local_normalized_fields: [], normalization_source_fields: [] },
  });
  readonly settings = signal<SupplierSettings>(this.defaultSettings());
  readonly draft = signal<SupplierSettings>(this.defaultSettings());
  readonly toast = signal<{ type: 'success' | 'error'; message: string } | null>(null);

  readonly methods = computed<HttpMethod[]>(() => this.schema().methods ?? ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

  load(supplierId: number): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.fieldErrors.set({});

    forkJoin({
      settings: this.api.getSettings(supplierId),
      schema: this.api.getSchema(supplierId),
    }).subscribe({
      next: ({ settings, schema }) => {
        this.settings.set(settings);
        this.draft.set(this.cloneSettings(settings));
        this.schema.set(schema);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? 'No se pudieron cargar los settings del supplier.');
        this.loading.set(false);
      },
    });
  }

  resetDraft(): void {
    this.fieldErrors.set({});
    this.errorMessage.set(null);
    this.draft.set(this.cloneSettings(this.settings()));
  }

  updateBaseUrl(value: string): void {
    this.draft.update((draft) => ({
      ...draft,
      api: { ...draft.api, base_url: value },
    }));
  }

  updateTimeoutSeconds(value: number | null): void {
    this.draft.update((draft) => ({
      ...draft,
      api: { ...draft.api, timeout_seconds: value },
    }));
  }

  updateAuth(patch: Partial<SupplierApiAuthSettings>): void {
    this.draft.update((draft) => ({
      ...draft,
      api: {
        ...draft.api,
        auth: {
          ...draft.api.auth,
          ...patch,
        },
      },
    }));
  }

  upsertEndpoint(key: string, endpoint: SupplierApiEndpoint): void {
    this.draft.update((draft) => ({
      ...draft,
      api: {
        ...draft.api,
        endpoints: {
          ...draft.api.endpoints,
          [key]: endpoint,
        },
      },
    }));
  }

  removeEndpoint(key: string): void {
    this.draft.update((draft) => {
      const endpoints = { ...draft.api.endpoints };
      delete endpoints[key];
      return {
        ...draft,
        api: {
          ...draft.api,
          endpoints,
        },
      };
    });
  }

  setMapping(mapping: Record<string, string>): void {
    this.draft.update((draft) => ({
      ...draft,
      api: {
        ...draft.api,
        mapping,
      },
    }));
  }

  setAttributesMapping(attributesMapping: Record<string, string>): void {
    this.draft.update((draft) => ({
      ...draft,
      api: {
        ...draft.api,
        attributes_mapping: attributesMapping,
      },
    }));
  }

  setNormalizationMapping(normalizationMapping: Record<string, string>): void {
    this.draft.update((draft) => ({
      ...draft,
      api: {
        ...draft.api,
        normalization_mapping: normalizationMapping,
      },
    }));
  }

  setMappingDocBody(value: string): void {
    this.draft.update((draft) => ({
      ...draft,
      api: {
        ...draft.api,
        mapping_doc_body: value,
      },
    }));
  }

  updateScheduleEnabled(enabled: boolean): void {
    this.draft.update((draft) => ({
      ...draft,
      schedule: {
        ...draft.schedule,
        enabled,
      },
    }));
  }

  updateScheduleTimezone(timezone: string): void {
    this.draft.update((draft) => ({
      ...draft,
      schedule: {
        ...draft.schedule,
        timezone,
      },
    }));
  }

  addScheduleDay(day: SupplierScheduleDay): void {
    this.draft.update((draft) => {
      if (draft.schedule.windows.some((window) => window.day === day)) return draft;
      return {
        ...draft,
        schedule: {
          ...draft.schedule,
          windows: [...draft.schedule.windows, { day, times: [] }],
        },
      };
    });
  }

  removeScheduleDay(day: SupplierScheduleDay): void {
    this.draft.update((draft) => ({
      ...draft,
      schedule: {
        ...draft.schedule,
        windows: draft.schedule.windows.filter((window) => window.day !== day),
      },
    }));
  }

  addScheduleTime(day: SupplierScheduleDay, time: string): void {
    const trimmed = time.trim();
    if (!TIME_24H_REGEX.test(trimmed)) return;

    this.draft.update((draft) => ({
      ...draft,
      schedule: {
        ...draft.schedule,
        windows: draft.schedule.windows.map((window) => {
          if (window.day !== day) return window;
          if (window.times.includes(trimmed)) return window;
          return { ...window, times: [...window.times, trimmed].sort() };
        }),
      },
    }));
  }

  addScheduleTimeToConfiguredDays(time: string): void {
    const trimmed = time.trim();
    if (!TIME_24H_REGEX.test(trimmed)) return;

    this.draft.update((draft) => ({
      ...draft,
      schedule: {
        ...draft.schedule,
        windows: draft.schedule.windows.map((window) => {
          if (window.times.includes(trimmed)) return window;
          return { ...window, times: [...window.times, trimmed].sort() };
        }),
      },
    }));
  }

  removeScheduleTime(day: SupplierScheduleDay, time: string): void {
    this.draft.update((draft) => ({
      ...draft,
      schedule: {
        ...draft.schedule,
        windows: draft.schedule.windows.map((window) => {
          if (window.day !== day) return window;
          return { ...window, times: window.times.filter((item) => item !== time) };
        }),
      },
    }));
  }

  setScheduleDate(field: 'start_date' | 'end_date', value: string | null): void {
    this.draft.update((draft) => ({
      ...draft,
      schedule: {
        ...draft.schedule,
        [field]: value,
      },
    }));
  }

  setScheduleMaxLagMinutes(value: number | null): void {
    this.draft.update((draft) => ({
      ...draft,
      schedule: {
        ...draft.schedule,
        max_lag_minutes: value,
      },
    }));
  }

  setScheduleJitterSeconds(value: number | null): void {
    this.draft.update((draft) => ({
      ...draft,
      schedule: {
        ...draft.schedule,
        jitter_seconds: value,
      },
    }));
  }

  save(supplierId: number): void {
    this.fieldErrors.set({});

    const localErrors = this.validateDraft(this.draft());
    if (Object.keys(localErrors).length > 0) {
      this.fieldErrors.set(localErrors);
      this.toast.set({ type: 'error', message: 'Revisa los campos requeridos antes de guardar.' });
      return;
    }

    this.saving.set(true);
    const payload = this.buildPatchPayload(this.draft());

    this.api.patchSettings(supplierId, payload).subscribe({
      next: (saved) => {
        forkJoin({
          settings: this.api.getSettings(supplierId),
          schema: this.api.getSchema(supplierId),
        }).subscribe({
          next: ({ settings, schema }) => {
            this.settings.set(settings);
            this.draft.set(this.cloneSettings(settings));
            this.schema.set(schema);
            this.toast.set({ type: 'success', message: 'Settings guardados correctamente.' });
            this.saving.set(false);
          },
          error: () => {
            this.settings.set(saved);
            this.draft.set(this.cloneSettings(saved));
            this.toast.set({ type: 'success', message: 'Settings guardados correctamente.' });
            this.saving.set(false);
          },
        });
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? 'No se pudieron guardar los settings.');
        const validationErrors = err?.error?.errors as SupplierSettingsFieldErrors | undefined;
        if (validationErrors && typeof validationErrors === 'object') {
          this.fieldErrors.set(validationErrors);
        }
        this.toast.set({ type: 'error', message: 'Error al guardar settings.' });
        this.saving.set(false);
      },
    });
  }

  clearToast(): void {
    this.toast.set(null);
  }

  buildPatchPayload(source: SupplierSettings): SupplierSettingsPatchPayload {
    return {
      settings: {
        api: {
          base_url: source.api.base_url.trim(),
          timeout_seconds: source.api.timeout_seconds,
          mapping_doc_body: this.nullIfEmpty(source.api.mapping_doc_body),
          auth: {
            type: source.api.auth.type,
            username: this.nullIfEmpty(source.api.auth.username),
            password: this.nullIfEmpty(source.api.auth.password),
            access_token: this.nullIfEmpty(source.api.auth.access_token),
            refresh_token: this.nullIfEmpty(source.api.auth.refresh_token),
            client_id: this.nullIfEmpty(source.api.auth.client_id),
            client_secret: this.nullIfEmpty(source.api.auth.client_secret),
            token_url: this.nullIfEmpty(source.api.auth.token_url),
            scope: this.nullIfEmpty(source.api.auth.scope),
            api_key: this.nullIfEmpty(source.api.auth.api_key),
            api_key_header: this.nullIfEmpty(source.api.auth.api_key_header),
            api_key_query_param: this.nullIfEmpty(source.api.auth.api_key_query_param),
            hmac_key: this.nullIfEmpty(source.api.auth.hmac_key),
            hmac_secret: this.nullIfEmpty(source.api.auth.hmac_secret),
            jwt: this.nullIfEmpty(source.api.auth.jwt),
          },
          endpoints: source.api.endpoints,
          mapping: source.api.mapping,
          attributes_mapping: source.api.attributes_mapping ?? {},
          normalization_mapping: source.api.normalization_mapping ?? {},
        },
        schedule: this.normalizeScheduleForPayload(source.schedule),
      },
    };
  }

  private validateDraft(source: SupplierSettings): SupplierSettingsFieldErrors {
    const errors: SupplierSettingsFieldErrors = {};

    if (!source.api.base_url.trim()) {
      errors['settings.api.base_url'] = ['El base_url es requerido.'];
    } else {
      try {
        new URL(source.api.base_url);
      } catch {
        errors['settings.api.base_url'] = ['El base_url debe ser una URL valida.'];
      }
    }

    Object.entries(source.api.endpoints).forEach(([key, endpoint]) => {
      if (!endpoint.path.trim()) {
        errors[`settings.api.endpoints.${key}.path`] = ['El path es requerido.'];
      }

      if (!this.methods().includes(endpoint.method)) {
        errors[`settings.api.endpoints.${key}.method`] = ['Metodo HTTP invalido.'];
      }
    });

    const normalizedWindows = this.normalizeScheduleWindows(source.schedule.windows);
    if (source.schedule.enabled) {
      if (!normalizedWindows.some((window) => window.times.length > 0)) {
        errors['settings.schedule.windows'] = ['Define al menos un dia con una hora valida para programar corridas.'];
      }
    }

    normalizedWindows.forEach((window, index) => {
      if (!window.times.every((time) => TIME_24H_REGEX.test(time))) {
        errors[`settings.schedule.windows.${index}.times`] = ['Todas las horas deben tener formato HH:mm.'];
      }
    });

    const startDate = this.nullIfEmpty(source.schedule.start_date);
    const endDate = this.nullIfEmpty(source.schedule.end_date);
    if (startDate && endDate && startDate > endDate) {
      errors['settings.schedule.date_range'] = ['start_date no puede ser mayor que end_date.'];
    }

    return errors;
  }

  private cloneSettings(source: SupplierSettings): SupplierSettings {
    return {
      api: {
        ...source.api,
        mapping_doc_body: source.api.mapping_doc_body ?? null,
        auth: { ...source.api.auth },
        endpoints: Object.fromEntries(
          Object.entries(source.api.endpoints).map(([key, endpoint]) => [
            key,
            {
              ...endpoint,
              query_map: { ...endpoint.query_map },
              headers: { ...endpoint.headers },
            },
          ]),
        ),
        mapping: { ...source.api.mapping },
        attributes_mapping: { ...(source.api.attributes_mapping ?? {}) },
        normalization_mapping: { ...(source.api.normalization_mapping ?? {}) },
      },
      schedule: {
        ...source.schedule,
        timezone: source.schedule.timezone ?? DEFAULT_SCHEDULE_TIMEZONE,
        windows: this.normalizeScheduleWindows(source.schedule.windows),
        start_date: source.schedule.start_date ?? null,
        end_date: source.schedule.end_date ?? null,
        max_lag_minutes: source.schedule.max_lag_minutes ?? DEFAULT_MAX_LAG_MINUTES,
        jitter_seconds: source.schedule.jitter_seconds ?? DEFAULT_JITTER_SECONDS,
      },
    };
  }

  private defaultSettings(): SupplierSettings {
    return {
      api: {
        base_url: '',
        timeout_seconds: 30,
        mapping_doc_body: null,
        auth: {
          type: 'none',
          has_password: false,
          has_client_secret: false,
          has_access_token: false,
          has_refresh_token: false,
          username: null,
          password: null,
          access_token: null,
          refresh_token: null,
          client_id: null,
          client_secret: null,
          token_url: null,
          scope: null,
          api_key: null,
          api_key_header: 'X-API-Key',
          api_key_query_param: 'api_key',
          hmac_key: null,
          hmac_secret: null,
          jwt: null,
        },
        endpoints: {},
        mapping: {},
        attributes_mapping: {},
        normalization_mapping: {},
      },
      schedule: {
        enabled: false,
        timezone: DEFAULT_SCHEDULE_TIMEZONE,
        windows: [],
        start_date: null,
        end_date: null,
        max_lag_minutes: DEFAULT_MAX_LAG_MINUTES,
        jitter_seconds: DEFAULT_JITTER_SECONDS,
      },
    };
  }

  private normalizeScheduleForPayload(source: SupplierScheduleSettings): SupplierScheduleSettings {
    return {
      enabled: Boolean(source.enabled),
      timezone: source.timezone.trim() || DEFAULT_SCHEDULE_TIMEZONE,
      windows: this.normalizeScheduleWindows(source.windows),
      start_date: this.nullIfEmpty(source.start_date),
      end_date: this.nullIfEmpty(source.end_date),
      max_lag_minutes: this.toNullableNonNegativeInteger(source.max_lag_minutes) ?? DEFAULT_MAX_LAG_MINUTES,
      jitter_seconds: this.toNullableNonNegativeInteger(source.jitter_seconds) ?? DEFAULT_JITTER_SECONDS,
    };
  }

  private normalizeScheduleWindows(windows: SupplierScheduleWindow[]): SupplierScheduleWindow[] {
    const byDay = new Map<SupplierScheduleDay, Set<string>>();

    windows.forEach((window) => {
      if (!window || !SCHEDULE_DAYS.includes(window.day)) return;

      const bucket = byDay.get(window.day) ?? new Set<string>();
      window.times.forEach((time) => {
        const normalized = String(time ?? '').trim();
        if (!TIME_24H_REGEX.test(normalized)) return;
        bucket.add(normalized);
      });

      byDay.set(window.day, bucket);
    });

    return SCHEDULE_DAYS.flatMap((day) => {
      const times = Array.from(byDay.get(day) ?? []).sort();
      if (times.length === 0) return [];
      return [{ day, times }];
    });
  }

  private nullIfEmpty(value: string | null | undefined): string | null {
    if (value === null || value === undefined) return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  private toNullableNonNegativeInteger(value: number | null | undefined): number | null {
    if (value === null || value === undefined) return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return null;
    if (parsed < 0) return null;
    return Math.floor(parsed);
  }
}
