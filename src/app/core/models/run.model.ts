export interface Run {
  id: string;
  supplier_id: string;
  supplier_name: string;
  run_number: string;
  status: RunStatus;
  file_path?: string;
  total_rows: number;
  processed_rows: number;
  new_products: number;
  updated_products: number;
  errors_count: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export enum RunStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REVIEWING = 'reviewing',
}

export interface RunSummary {
  total_changes: number;
  price_changes: number;
  stock_changes: number;
  new_items: number;
  discontinued_items: number;
}

export interface RunDelta {
  id: string;
  run_id: string;
  product_id?: string;
  sku: string;
  field_name: string;
  old_value?: string;
  new_value?: string;
  change_type: DeltaChangeType;
  created_at: string;
}

export enum DeltaChangeType {
  NEW = 'new',
  UPDATED = 'updated',
  DELETED = 'deleted',
  UNCHANGED = 'unchanged',
}

export interface RunComparison {
  run_a: Run;
  run_b: Run;
  differences: RunDelta[];
  summary: {
    total_differences: number;
    price_differences: number;
    stock_differences: number;
  };
}

export interface RunQueryParams {
  supplier_id?: string;
  status?: RunStatus;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
}
