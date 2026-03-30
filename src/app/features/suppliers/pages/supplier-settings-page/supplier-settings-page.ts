import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EndpointEditorModalComponent } from '../../components/endpoint-editor-modal/endpoint-editor-modal.component';
import { JsonPreviewComponent } from '../../components/json-preview/json-preview.component';
import { MappingTableComponent } from '../../components/mapping-table/mapping-table.component';
import { EndpointPurpose, SupplierApiEndpoint, SupplierScheduleDay } from '../../models/supplier-settings.model';
import { SupplierApiPingResponse } from '../../models/supplier-api-ping.model';
import { SupplierSettingsStore } from '../../services/supplier-settings.store';
import { SupplierSettingsApi } from '../../services/supplier-settings.api';
import { getApiUrl } from '../../../../core/config/api.config';

type SettingsTab = 'api' | 'mapping' | 'schedule';
const DEFAULT_SCHEDULE_TIMEZONE = 'America/New_York';
const FALLBACK_TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Mexico_City',
  'America/Bogota',
  'America/Lima',
  'America/Santiago',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Madrid',
  'UTC',
];

@Component({
  selector: 'app-supplier-settings-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    EndpointEditorModalComponent,
    MappingTableComponent,
    JsonPreviewComponent,
  ],
  templateUrl: './supplier-settings-page.html',
})
export class SupplierSettingsPage implements OnInit {
  readonly store = inject(SupplierSettingsStore);
  private readonly settingsApi = inject(SupplierSettingsApi);
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly suppliersUrl = getApiUrl('suppliers');

  readonly supplierId = signal(0);
  readonly activeTab = signal<SettingsTab>('api');

  readonly endpointRows = computed(() =>
    Object.entries(this.store.draft().api.endpoints).map(([key, endpoint]) => ({ key, endpoint })),
  );
  readonly payloadPreview = computed(() => this.store.buildPatchPayload(this.store.draft()));

  readonly endpointModalOpen = signal(false);
  readonly endpointModalMode = signal<'create' | 'edit'>('create');
  readonly editingEndpointKey = signal('');
  readonly createEndpointTemplate = signal<SupplierApiEndpoint | null>(null);

  readonly editingEndpoint = computed(() => {
    if (this.endpointModalMode() === 'create') {
      return this.createEndpointTemplate();
    }

    const key = this.editingEndpointKey();
    if (!key) return null;
    return this.store.draft().api.endpoints[key] ?? null;
  });

  readonly isPingingApi = signal(false);
  readonly pingResult = signal<SupplierApiPingResponse | null>(null);
  readonly pingError = signal<string | null>(null);

  readonly authOptions = [
    { value: 'none', label: 'None' },
    { value: 'basic', label: 'User + Password (Basic)' },
    { value: 'bearer', label: 'Access Token (Bearer)' },
    { value: 'oauth2_client_credentials', label: 'OAuth2 Client Credentials' },
    { value: 'oauth2_password', label: 'OAuth2 Password Grant' },
    { value: 'api_key_header', label: 'API Key in Header' },
    { value: 'api_key_query', label: 'API Key in Query Param' },
    { value: 'jwt', label: 'JWT Token' },
    { value: 'hmac', label: 'HMAC Signature' },
  ] as const;

  readonly localRawFields = computed(() => this.store.schema().mapping?.local_raw_fields ?? []);
  readonly schedule = computed(() => this.store.draft().schedule);
  readonly availableScheduleDays = computed(() => {
    const selected = new Set(this.schedule().windows.map((window) => window.day));
    return this.addableScheduleDayOptions.filter((option) => !selected.has(option.value));
  });
  readonly scheduleErrors = computed(() => this.store.fieldErrors());
  readonly scheduleTimeDraft = signal<Partial<Record<SupplierScheduleDay, string>>>({});
  readonly globalScheduleTimeDraft = signal('');
  readonly timezoneOptions = this.buildTimezoneOptions();
  readonly timezoneOptionsForSelect = computed(() => {
    const current = this.schedule().timezone?.trim();
    if (!current) return this.timezoneOptions;
    return this.timezoneOptions.includes(current) ? this.timezoneOptions : [current, ...this.timezoneOptions];
  });

  readonly addableScheduleDayOptions: Array<{ value: SupplierScheduleDay; label: string }> = [
    { value: 'monday', label: 'Lunes' },
    { value: 'tuesday', label: 'Martes' },
    { value: 'wednesday', label: 'Miercoles' },
    { value: 'thursday', label: 'Jueves' },
    { value: 'friday', label: 'Viernes' },
  ];

  private readonly scheduleDayLabelMap: Record<SupplierScheduleDay, string> = {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miercoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sabado',
    sunday: 'Domingo',
  };

  private readonly uniquePurposeSet = new Set<EndpointPurpose>([
    'login',
    'refresh',
    'run',
    'mapping',
    'health',
  ]);

  private readonly authPathToField: Record<string, 'password' | 'access_token' | 'refresh_token' | 'client_secret' | 'api_key' | 'hmac_secret' | 'jwt'> = {
    'api.auth.password': 'password',
    'api.auth.access_token': 'access_token',
    'api.auth.refresh_token': 'refresh_token',
    'api.auth.client_secret': 'client_secret',
    'api.auth.api_key': 'api_key',
    'api.auth.hmac_secret': 'hmac_secret',
    'api.auth.jwt': 'jwt',
  };

  ngOnInit(): void {
    const supplierId = Number(this.route.snapshot.paramMap.get('supplierId'));
    this.supplierId.set(Number.isFinite(supplierId) ? supplierId : 0);
    if (this.supplierId() > 0) this.store.load(this.supplierId());

    this.route.queryParamMap.subscribe((params) => {
      const tab = params.get('tab');
      this.activeTab.set(tab === 'mapping' || tab === 'schedule' ? tab : 'api');
    });
  }

  setTab(tab: SettingsTab): void {
    this.activeTab.set(tab);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge',
    });
  }

  setBaseUrl(value: string): void {
    this.store.updateBaseUrl(value);
  }

  setTimeout(value: string): void {
    const parsed = Number(value);
    this.store.updateTimeoutSeconds(Number.isFinite(parsed) && parsed > 0 ? parsed : null);
  }

  get authType(): string {
    return this.store.draft().api.auth.type || 'none';
  }

  updateAuthType(type: string): void {
    this.store.updateAuth({ type });
    this.clearPingState();
  }

  updateAuthField(
    key:
      | 'username'
      | 'password'
      | 'access_token'
      | 'refresh_token'
      | 'client_id'
      | 'client_secret'
      | 'token_url'
      | 'scope'
      | 'api_key'
      | 'api_key_header'
      | 'api_key_query_param'
      | 'hmac_key'
      | 'hmac_secret'
      | 'jwt',
    value: string,
  ): void {
    this.store.updateAuth({ [key]: value });
  }

  setMapping(mapping: Record<string, string>): void {
    this.store.setMapping(mapping);
  }

  setAttributesMapping(attributesMapping: Record<string, string>): void {
    this.store.setAttributesMapping(attributesMapping);
  }

  setMappingDocBody(value: string): void {
    this.store.setMappingDocBody(value);
  }

  setScheduleEnabled(value: boolean): void {
    this.store.updateScheduleEnabled(value);
  }

  setScheduleTimezone(value: string): void {
    this.store.updateScheduleTimezone(value);
  }

  addScheduleDay(day: string): void {
    if (!day) return;
    this.store.addScheduleDay(day as SupplierScheduleDay);
  }

  addSchedulePreset(preset: 'weekdays' | 'weekend' | 'daily'): void {
    const daysByPreset: Record<'weekdays' | 'weekend' | 'daily', SupplierScheduleDay[]> = {
      weekdays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      weekend: ['saturday', 'sunday'],
      daily: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    };

    daysByPreset[preset].forEach((day) => this.store.addScheduleDay(day));
  }

  removeScheduleDay(day: SupplierScheduleDay): void {
    this.store.removeScheduleDay(day);
  }

  setScheduleDate(field: 'start_date' | 'end_date', value: string): void {
    this.store.setScheduleDate(field, value.trim() ? value : null);
  }

  setScheduleMaxLagMinutes(value: string): void {
    const parsed = Number(value);
    this.store.setScheduleMaxLagMinutes(Number.isFinite(parsed) && parsed >= 0 ? parsed : null);
  }

  setScheduleJitterSeconds(value: string): void {
    const parsed = Number(value);
    this.store.setScheduleJitterSeconds(Number.isFinite(parsed) && parsed >= 0 ? parsed : null);
  }

  getScheduleTimeDraft(day: SupplierScheduleDay): string {
    return this.scheduleTimeDraft()[day] ?? '';
  }

  updateScheduleTimeDraft(day: SupplierScheduleDay, value: string): void {
    this.scheduleTimeDraft.update((current) => ({ ...current, [day]: value }));
  }

  addScheduleTime(day: SupplierScheduleDay): void {
    const time = this.getScheduleTimeDraft(day);
    this.store.addScheduleTime(day, time);
    this.updateScheduleTimeDraft(day, '');
  }

  removeScheduleTime(day: SupplierScheduleDay, time: string): void {
    this.store.removeScheduleTime(day, time);
  }

  setGlobalScheduleTimeDraft(value: string): void {
    this.globalScheduleTimeDraft.set(value);
  }

  addGlobalScheduleTime(): void {
    this.store.addScheduleTimeToConfiguredDays(this.globalScheduleTimeDraft());
    this.globalScheduleTimeDraft.set('');
  }

  dayLabel(day: SupplierScheduleDay): string {
    return this.scheduleDayLabelMap[day] ?? day;
  }

  private buildTimezoneOptions(): string[] {
    const supportedValuesOf = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf;
    if (typeof supportedValuesOf === 'function') {
      const zones = supportedValuesOf('timeZone');
      if (zones.length > 0) {
        if (zones.includes(DEFAULT_SCHEDULE_TIMEZONE)) return zones;
        return [DEFAULT_SCHEDULE_TIMEZONE, ...zones];
      }
    }

    return FALLBACK_TIMEZONES;
  }

  openCreateEndpoint(): void {
    this.endpointModalMode.set('create');
    this.editingEndpointKey.set('');
    this.createEndpointTemplate.set({
      method: 'GET',
      path: '',
      purpose: 'none',
      query_map: {},
      headers: {},
      response_items_path: null,
      response_item_path: null,
    });
    this.endpointModalOpen.set(true);
  }

  openInitConnectionEndpoint(): void {
    const key = this.getSuggestedEndpointKey();

    this.endpointModalMode.set('create');
    this.editingEndpointKey.set(key);
    this.createEndpointTemplate.set({
      method: 'POST',
      path: '',
      purpose: 'login',
      query_map: {},
      headers: {},
      response_items_path: null,
      response_item_path: null,
    });
    this.endpointModalOpen.set(true);
  }

  openEditEndpoint(key: string): void {
    this.endpointModalMode.set('edit');
    this.editingEndpointKey.set(key);
    this.createEndpointTemplate.set(null);
    this.endpointModalOpen.set(true);
  }

  closeEndpointModal(): void {
    this.endpointModalOpen.set(false);
    this.createEndpointTemplate.set(null);
  }

  saveEndpoint(event: { key: string; endpoint: SupplierApiEndpoint }): void {
    if (!event.key.trim()) {
      this.store.fieldErrors.set({ ...this.store.fieldErrors(), endpoint_key: ['La clave del endpoint es requerida.'] });
      return;
    }

    const normalizedKey = event.key.trim();
    const normalizedPurpose = this.normalizePurpose(event.endpoint.purpose);
    const normalizedEndpoint: SupplierApiEndpoint = {
      ...event.endpoint,
      purpose: normalizedPurpose,
    };

    if (this.uniquePurposeSet.has(normalizedPurpose)) {
      this.endpointRows()
        .filter((row) => row.key !== normalizedKey && row.endpoint.purpose === normalizedPurpose)
        .forEach((row) => {
          this.store.upsertEndpoint(row.key, { ...row.endpoint, purpose: 'none' });
        });
    }

    this.store.upsertEndpoint(normalizedKey, normalizedEndpoint);
    this.store.fieldErrors.set({});
    this.closeEndpointModal();
  }

  removeEndpoint(key: string): void {
    this.store.removeEndpoint(key);
  }

  saveSettings(): void {
    if (this.supplierId() <= 0) return;
    this.store.save(this.supplierId());
  }

  resetChanges(): void {
    this.store.resetDraft();
    this.clearPingState();
  }

  testApiConnection(): void {
    if (this.supplierId() <= 0) return;

    this.isPingingApi.set(true);
    this.pingError.set(null);
    this.pingResult.set(null);

    this.http.post<SupplierApiPingResponse>(`${this.suppliersUrl}/${this.supplierId()}/api/ping`, {}).subscribe({
      next: (res) => {
        this.pingResult.set(res);
        this.isPingingApi.set(false);
      },
      error: (err) => {
        const payload = err?.error as Partial<SupplierApiPingResponse> | undefined;

        if (payload && (payload.status === 'error' || payload.status === 'ok') && payload.message) {
          this.pingResult.set({
            status: payload.status,
            message: payload.message,
            auth_type: (payload.auth_type as SupplierApiPingResponse['auth_type']) ?? (this.authType as SupplierApiPingResponse['auth_type']),
            latency_ms: Number(payload.latency_ms ?? 0),
            checked_at: String(payload.checked_at ?? new Date().toISOString()),
            details: payload.details,
          });
          this.pingError.set(null);
        } else {
          this.pingError.set(err?.error?.message ?? 'No se pudo validar la autenticacion API.');
        }

        this.isPingingApi.set(false);
      },
    });
  }

  getPingTrace(): string {
    const result = this.pingResult();
    return result ? JSON.stringify(result, null, 2) : '';
  }

  clearSecret(path: string): void {
    if (this.supplierId() <= 0) return;

    this.settingsApi.clearSecrets(this.supplierId(), { path }).subscribe({
      next: (res) => {
        this.applyClearedSecrets(res.cleared);
        this.store.toast.set({ type: 'success', message: res.message ?? 'Secreto limpiado correctamente.' });
        this.clearPingState();
      },
      error: (err) => {
        this.store.toast.set({ type: 'error', message: err?.error?.message ?? 'No se pudo limpiar el secreto.' });
      },
    });
  }

  clearAllSecrets(): void {
    if (this.supplierId() <= 0) return;

    const paths = Object.keys(this.authPathToField);
    this.settingsApi.clearSecrets(this.supplierId(), { paths }).subscribe({
      next: (res) => {
        this.applyClearedSecrets(res.cleared);
        this.store.toast.set({ type: 'success', message: res.message ?? 'Secretos limpiados correctamente.' });
        this.clearPingState();
      },
      error: (err) => {
        this.store.toast.set({ type: 'error', message: err?.error?.message ?? 'No se pudieron limpiar los secretos.' });
      },
    });
  }

  private applyClearedSecrets(paths: string[]): void {
    paths.forEach((path) => {
      const field = this.authPathToField[path];
      if (!field) return;
      this.store.updateAuth({ [field]: null });
    });
  }

  private clearPingState(): void {
    this.isPingingApi.set(false);
    this.pingResult.set(null);
    this.pingError.set(null);
  }

  private getSuggestedEndpointKey(): string {
    return 'login';
  }

  private normalizePurpose(purpose: EndpointPurpose | undefined): EndpointPurpose {
    if (!purpose) return 'none';

    const validPurposes: EndpointPurpose[] = [
      'none',
      'login',
      'refresh',
      'run',
      'mapping',
      'get',
      'list',
      'create',
      'update',
      'delete',
      'health',
    ];

    return validPurposes.includes(purpose) ? purpose : 'none';
  }
}
