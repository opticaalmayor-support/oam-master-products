export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type EndpointPurpose =
  | 'login'
  | 'refresh'
  | 'run'
  | 'testing'
  | 'mapping'
  | 'none'
  | 'get'
  | 'list'
  | 'create'
  | 'update'
  | 'delete'
  | 'health';

export interface SupplierApiAuthSettings {
  type: string;
  has_password?: boolean;
  has_client_secret?: boolean;
  has_access_token?: boolean;
  has_refresh_token?: boolean;
  username?: string | null;
  password?: string | null;
  access_token?: string | null;
  refresh_token?: string | null;
  client_id?: string | null;
  client_secret?: string | null;
  token_url?: string | null;
  scope?: string | null;
  api_key?: string | null;
  api_key_header?: string | null;
  api_key_query_param?: string | null;
  hmac_key?: string | null;
  hmac_secret?: string | null;
  jwt?: string | null;
}

export interface SupplierApiEndpoint {
  method: HttpMethod;
  path: string;
  purpose?: EndpointPurpose;
  enabled?: boolean;
  priority?: number;
  variant?: string | null;
  query_map: Record<string, string>;
  headers: Record<string, string>;
  response_items_path?: string | null;
  response_item_path?: string | null;
  response_total_path?: string | null;
}

export interface SupplierApiSettings {
  base_url: string;
  timeout_seconds: number | null;
  mapping_doc_body?: string | null;
  auth: SupplierApiAuthSettings;
  endpoints: Record<string, SupplierApiEndpoint>;
  mapping: Record<string, string>;
  attributes_mapping?: Record<string, string>;
}

export type SupplierScheduleDay =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface SupplierScheduleWindow {
  day: SupplierScheduleDay;
  times: string[];
}

export interface SupplierScheduleSettings {
  enabled: boolean;
  timezone: string;
  windows: SupplierScheduleWindow[];
  start_date?: string | null;
  end_date?: string | null;
  max_lag_minutes?: number | null;
  jitter_seconds?: number | null;
}

export interface SupplierSettings {
  api: SupplierApiSettings;
  schedule: SupplierScheduleSettings;
}

export interface SupplierSettingsResponse {
  settings: SupplierSettings;
}

export interface SupplierSettingsSchema {
  auth?: {
    type?: string;
    has_password?: boolean;
    has_client_secret?: boolean;
    has_access_token?: boolean;
    has_refresh_token?: boolean;
  };
  methods?: HttpMethod[];
  mapping?: {
    local_raw_fields?: string[];
  };
}

export interface SupplierSettingsSchemaResponse {
  schema: SupplierSettingsSchema;
}

export interface SupplierSettingsPatchPayload {
  settings: {
    api: {
      base_url: string;
      timeout_seconds: number | null;
      mapping_doc_body?: string | null;
      auth?: SupplierApiAuthSettings;
      endpoints: Record<string, SupplierApiEndpoint>;
      mapping: Record<string, string>;
      attributes_mapping?: Record<string, string>;
    };
    schedule: {
      enabled: boolean;
      timezone: string;
      windows: SupplierScheduleWindow[];
      start_date?: string | null;
      end_date?: string | null;
      max_lag_minutes?: number | null;
      jitter_seconds?: number | null;
    };
  };
}

export interface SupplierSettingsFieldErrors {
  [field: string]: string[];
}

export interface SupplierClearSecretPayload {
  path?: string;
  paths?: string[];
}

export interface SupplierClearSecretResponse {
  ok: boolean;
  cleared: string[];
  message?: string;
}
