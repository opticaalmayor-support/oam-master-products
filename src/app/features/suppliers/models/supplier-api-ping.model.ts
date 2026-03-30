export type SupplierApiAuthType =
  | 'none'
  | 'basic'
  | 'bearer'
  | 'oauth2_client_credentials'
  | 'oauth2_password'
  | 'api_key_header'
  | 'api_key_query'
  | 'jwt'
  | 'hmac';

export interface SupplierApiPingResponse {
  status: 'ok' | 'error';
  message: string;
  auth_type: SupplierApiAuthType;
  latency_ms: number;
  checked_at: string;
  details?: {
    http_status?: number;
    stage?: 'config' | 'auth' | 'network' | 'timeout' | 'unknown';
    error_code?: string;
  };
}

export interface SupplierApiPingRequest {}
