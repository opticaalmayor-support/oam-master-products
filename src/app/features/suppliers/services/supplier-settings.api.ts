import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { getApiUrl } from '../../../core/config/api.config';
import {
  EndpointPurpose,
  HttpMethod,
  SupplierClearSecretPayload,
  SupplierClearSecretResponse,
  SupplierApiEndpoint,
  SupplierImageRequestSettings,
  SupplierScheduleDay,
  SupplierScheduleSettings,
  SupplierScheduleWindow,
  SupplierSettings,
  SupplierSettingsPatchPayload,
  SupplierSettingsResponse,
  SupplierSettingsSchema,
  SupplierSettingsSchemaResponse,
} from '../models/supplier-settings.model';

const DEFAULT_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const DEFAULT_PURPOSES: EndpointPurpose[] = [
  'none',
  'login',
  'refresh',
  'run',
  'testing',
  'mapping',
  'get',
  'list',
  'create',
  'update',
  'delete',
  'health',
];
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
const DEFAULT_IMAGE_REQUEST_TIMEOUT_SECONDS = 20;

@Injectable({ providedIn: 'root' })
export class SupplierSettingsApi {
  private readonly http = inject(HttpClient);
  private readonly suppliersUrl = getApiUrl('suppliers');

  getSettings(supplierId: number): Observable<SupplierSettings> {
    return this.http
      .get<SupplierSettingsResponse | { settings?: unknown }>(`${this.suppliersUrl}/${supplierId}/settings`)
      .pipe(map((res) => this.normalizeSettings((res as SupplierSettingsResponse).settings ?? (res as { settings?: unknown }).settings)));
  }

  getSchema(supplierId: number): Observable<SupplierSettingsSchema> {
    return this.http
      .get<SupplierSettingsSchemaResponse | { schema?: unknown }>(`${this.suppliersUrl}/${supplierId}/settings/schema`)
      .pipe(map((res) => this.normalizeSchema((res as SupplierSettingsSchemaResponse).schema ?? (res as { schema?: unknown }).schema)));
  }

  patchSettings(supplierId: number, payload: SupplierSettingsPatchPayload): Observable<SupplierSettings> {
    return this.http
      .patch<SupplierSettingsResponse | { settings?: unknown }>(`${this.suppliersUrl}/${supplierId}/settings`, payload)
      .pipe(map((res) => this.normalizeSettings((res as SupplierSettingsResponse).settings ?? (res as { settings?: unknown }).settings)));
  }

  clearSecrets(supplierId: number, payload: SupplierClearSecretPayload): Observable<SupplierClearSecretResponse> {
    return this.http.post<SupplierClearSecretResponse>(`${this.suppliersUrl}/${supplierId}/settings/clear-secret`, payload);
  }

  private normalizeSettings(raw: unknown): SupplierSettings {
    const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
    const api = source['api'] && typeof source['api'] === 'object' ? (source['api'] as Record<string, unknown>) : {};
    const schedule =
      source['schedule'] && typeof source['schedule'] === 'object'
        ? (source['schedule'] as Record<string, unknown>)
        : {};
    const auth = api['auth'] && typeof api['auth'] === 'object' ? (api['auth'] as Record<string, unknown>) : {};
    const imageRequestRaw =
      api['image_request'] && typeof api['image_request'] === 'object'
        ? (api['image_request'] as Record<string, unknown>)
        : {};
    const endpointsRaw =
      api['endpoints'] && typeof api['endpoints'] === 'object'
        ? (api['endpoints'] as Record<string, unknown>)
        : {};
    const mappingRaw =
      api['mapping'] && typeof api['mapping'] === 'object' ? (api['mapping'] as Record<string, unknown>) : {};
    const attributesMappingRaw =
      api['attributes_mapping'] && typeof api['attributes_mapping'] === 'object'
        ? (api['attributes_mapping'] as Record<string, unknown>)
        : {};
    const normalizationMappingRaw =
      api['normalization_mapping'] && typeof api['normalization_mapping'] === 'object'
        ? (api['normalization_mapping'] as Record<string, unknown>)
        : {};
    const normalizationCompositeMappingRaw =
      api['normalization_composite_mapping'] && typeof api['normalization_composite_mapping'] === 'object'
        ? (api['normalization_composite_mapping'] as Record<string, unknown>)
        : {};

    const endpoints: Record<string, SupplierApiEndpoint> = {};
    Object.entries(endpointsRaw).forEach(([key, value]) => {
      if (!key.trim()) return;
      endpoints[key] = this.normalizeEndpoint(value);
    });

    const mapping: Record<string, string> = {};
    Object.entries(mappingRaw).forEach(([key, value]) => {
      if (!key.trim()) return;
      mapping[key] = String(value ?? '');
    });

    const attributesMapping: Record<string, string> = {};
    Object.entries(attributesMappingRaw).forEach(([key, value]) => {
      if (!key.trim()) return;
      attributesMapping[key] = String(value ?? '');
    });

    const normalizationMapping: Record<string, string> = {};
    Object.entries(normalizationMappingRaw).forEach(([key, value]) => {
      if (!key.trim()) return;
      normalizationMapping[key] = String(value ?? '');
    });

    const normalizationCompositeMapping: Record<string, string[]> = {};
    Object.entries(normalizationCompositeMappingRaw).forEach(([key, value]) => {
      if (!key.trim()) return;
      if (Array.isArray(value)) {
        normalizationCompositeMapping[key] = value
          .map((item) => String(item ?? '').trim())
          .filter((item) => item.length > 0);
        return;
      }

      const single = String(value ?? '').trim();
      if (single) normalizationCompositeMapping[key] = [single];
    });

    return {
      api: {
        base_url: String(api['base_url'] ?? ''),
        timeout_seconds: this.toNullableNumber(api['timeout_seconds']),
        mapping_doc_body: this.toNullableString(api['mapping_doc_body']),
        auth: {
          type: String(auth['type'] ?? 'none'),
          has_password: Boolean(auth['has_password']),
          has_client_secret: Boolean(auth['has_client_secret']),
          has_access_token: Boolean(auth['has_access_token']),
          has_refresh_token: Boolean(auth['has_refresh_token']),
          username: this.toNullableString(auth['username']),
          password: this.toNullableString(auth['password']),
          access_token: this.toNullableString(auth['access_token']),
          refresh_token: this.toNullableString(auth['refresh_token']),
          client_id: this.toNullableString(auth['client_id']),
          client_secret: this.toNullableString(auth['client_secret']),
          token_url: this.toNullableString(auth['token_url']),
          scope: this.toNullableString(auth['scope']),
          api_key: this.toNullableString(auth['api_key']),
          api_key_header: this.toNullableString(auth['api_key_header']),
          api_key_query_param: this.toNullableString(auth['api_key_query_param']),
          hmac_key: this.toNullableString(auth['hmac_key']),
          hmac_secret: this.toNullableString(auth['hmac_secret']),
          jwt: this.toNullableString(auth['jwt']),
        },
        endpoints,
        image_request: this.normalizeImageRequest(imageRequestRaw),
        mapping,
        attributes_mapping: attributesMapping,
        normalization_mapping: normalizationMapping,
        normalization_composite_mapping: normalizationCompositeMapping,
      },
      schedule: this.normalizeSchedule(schedule),
    };
  }

  private normalizeSchema(raw: unknown): SupplierSettingsSchema {
    const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
    const auth = source['auth'] && typeof source['auth'] === 'object' ? (source['auth'] as Record<string, unknown>) : {};
    const mapping =
      source['mapping'] && typeof source['mapping'] === 'object'
        ? (source['mapping'] as Record<string, unknown>)
        : {};

    const localRawFields = Array.isArray(mapping['local_raw_fields'])
      ? mapping['local_raw_fields'].map((field) => String(field)).filter((field) => field.trim().length > 0)
      : [];
    const localNormalizedFields = Array.isArray(mapping['local_normalized_fields'])
      ? mapping['local_normalized_fields'].map((field) => String(field)).filter((field) => field.trim().length > 0)
      : [];
    const normalizationSourceFields = Array.isArray(mapping['normalization_source_fields'])
      ? mapping['normalization_source_fields'].map((field) => String(field)).filter((field) => field.trim().length > 0)
      : [];

    const methods = Array.isArray(source['methods'])
      ? source['methods'].filter((m): m is HttpMethod => DEFAULT_METHODS.includes(String(m).toUpperCase() as HttpMethod)).map(m => String(m).toUpperCase() as HttpMethod)
      : DEFAULT_METHODS;

    return {
      auth: {
        type: String(auth['type'] ?? ''),
        has_password: Boolean(auth['has_password']),
        has_client_secret: Boolean(auth['has_client_secret']),
        has_access_token: Boolean(auth['has_access_token']),
        has_refresh_token: Boolean(auth['has_refresh_token']),
      },
      methods,
      mapping: {
        local_raw_fields: localRawFields,
        local_normalized_fields: localNormalizedFields,
        normalization_source_fields: normalizationSourceFields,
      },
    };
  }

  private normalizeEndpoint(raw: unknown): SupplierApiEndpoint {
    const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};

    const method = String(source['method'] ?? 'GET').toUpperCase();
    const normalizedMethod: HttpMethod = DEFAULT_METHODS.includes(method as HttpMethod)
      ? (method as HttpMethod)
      : 'GET';

    const rawPurpose = String(source['purpose'] ?? 'none');
    const purpose = rawPurpose === 'ping_auth' ? 'health' : rawPurpose;
    const normalizedPurpose: EndpointPurpose = DEFAULT_PURPOSES.includes(purpose as EndpointPurpose)
      ? (purpose as EndpointPurpose)
      : 'none';

    const queryMap = this.normalizeStringMap(source['query_map']);
    const headers = this.normalizeStringMap(source['headers']);

    return {
      method: normalizedMethod,
      path: String(source['path'] ?? ''),
      purpose: normalizedPurpose,
      enabled: source['enabled'] === undefined ? true : Boolean(source['enabled']),
      priority: this.toNonNegativeInt(source['priority'], 100),
      variant: this.toNullableString(source['variant']),
      query_map: queryMap,
      headers,
      response_items_path: this.toNullableString(source['response_items_path']),
      response_item_path: this.toNullableString(source['response_item_path']),
      response_total_path: this.toNullableString(source['response_total_path']),
    };
  }

  private normalizeImageRequest(raw: Record<string, unknown>): SupplierImageRequestSettings {
    return {
      headers: this.normalizeStringMap(raw['headers']),
      cookies: this.normalizeStringMap(raw['cookies']),
      timeout_seconds: this.toNullableNumber(raw['timeout_seconds']) ?? DEFAULT_IMAGE_REQUEST_TIMEOUT_SECONDS,
    };
  }

  private normalizeStringMap(raw: unknown): Record<string, string> {
    if (!raw || typeof raw !== 'object') return {};
    const source = raw as Record<string, unknown>;
    const map: Record<string, string> = {};
    Object.entries(source).forEach(([key, value]) => {
      if (!key.trim()) return;
      map[key] = String(value ?? '');
    });
    return map;
  }

  private normalizeSchedule(raw: Record<string, unknown>): SupplierScheduleSettings {
    const windowsRaw = Array.isArray(raw['windows']) ? raw['windows'] : [];
    const windowsByDay = new Map<SupplierScheduleDay, Set<string>>();

    windowsRaw.forEach((windowRaw) => {
      if (!windowRaw || typeof windowRaw !== 'object') return;
      const source = windowRaw as Record<string, unknown>;
      const dayValue = String(source['day'] ?? '').toLowerCase();
      if (!SCHEDULE_DAYS.includes(dayValue as SupplierScheduleDay)) return;
      const day = dayValue as SupplierScheduleDay;

      const timesRaw = Array.isArray(source['times']) ? source['times'] : [];
      const bucket = windowsByDay.get(day) ?? new Set<string>();

      timesRaw.forEach((timeRaw) => {
        const time = String(timeRaw ?? '').trim();
        if (!TIME_24H_REGEX.test(time)) return;
        bucket.add(time);
      });

      if (bucket.size > 0) {
        windowsByDay.set(day, bucket);
      }
    });

    const windows: SupplierScheduleWindow[] = SCHEDULE_DAYS.flatMap((day) => {
      const times = Array.from(windowsByDay.get(day) ?? []);
      if (times.length === 0) return [];
      return [{ day, times }];
    });

    return {
      enabled: Boolean(raw['enabled']),
      timezone: this.normalizeTimezone(raw['timezone']),
      windows,
      start_date: this.toNullableDateString(raw['start_date']),
      end_date: this.toNullableDateString(raw['end_date']),
      max_lag_minutes: this.toNullableNumber(raw['max_lag_minutes']) ?? DEFAULT_MAX_LAG_MINUTES,
      jitter_seconds: this.toNullableNumber(raw['jitter_seconds']) ?? DEFAULT_JITTER_SECONDS,
    };
  }

  private toNullableNumber(raw: unknown): number | null {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private toNonNegativeInt(raw: unknown, fallback: number): number {
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return fallback;
    if (parsed < 0) return fallback;
    return Math.floor(parsed);
  }

  private toNullableString(raw: unknown): string | null {
    if (raw === null || raw === undefined || raw === '') return null;
    return String(raw);
  }

  private toNullableDateString(raw: unknown): string | null {
    const value = this.toNullableString(raw);
    if (!value) return null;
    return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
  }

  private normalizeTimezone(raw: unknown): string {
    const candidate = String(raw ?? '').trim();
    if (!candidate) return DEFAULT_SCHEDULE_TIMEZONE;

    const supportedValuesOf = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf;
    if (typeof supportedValuesOf !== 'function') return candidate;

    const supported = supportedValuesOf('timeZone');
    return supported.includes(candidate) ? candidate : DEFAULT_SCHEDULE_TIMEZONE;
  }
}
