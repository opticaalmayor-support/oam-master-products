export interface OdooSyncJob {
  id: string;
  job_type: SyncJobType;
  status: SyncStatus;
  entity_type: SyncEntityType;
  entity_ids?: string[];
  total_records: number;
  processed_records: number;
  success_count: number;
  error_count: number;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export enum SyncJobType {
  FULL_SYNC = 'full_sync',
  INCREMENTAL_SYNC = 'incremental_sync',
  MANUAL_SYNC = 'manual_sync',
  PRODUCT_SYNC = 'product_sync',
  PRICE_SYNC = 'price_sync',
  STOCK_SYNC = 'stock_sync',
}

export enum SyncStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum SyncEntityType {
  PRODUCT = 'product',
  VARIANT = 'variant',
  PRICE = 'price',
  STOCK = 'stock',
  CATEGORY = 'category',
  SUPPLIER = 'supplier',
}

export interface OdooSyncLog {
  id: string;
  sync_job_id: string;
  entity_type: SyncEntityType;
  entity_id: string;
  action: SyncAction;
  status: SyncLogStatus;
  odoo_id?: number;
  request_payload?: Record<string, any>;
  response_data?: Record<string, any>;
  error_message?: string;
  created_at: string;
}

export enum SyncAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  SKIP = 'skip',
}

export enum SyncLogStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

export interface OdooSyncConfig {
  id: string;
  entity_type: SyncEntityType;
  auto_sync_enabled: boolean;
  sync_frequency_minutes?: number;
  field_mappings: Record<string, string>;
  filters?: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SyncSummary {
  total_synced: number;
  successful: number;
  failed: number;
  skipped: number;
  last_sync_at?: string;
  next_sync_at?: string;
}
