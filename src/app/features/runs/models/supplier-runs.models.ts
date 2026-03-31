export interface StartApiRunRequest {
  purpose: 'run' | 'testing';
  request: {
    page: number;
    pageSize: number;
    max_pages: number;
    brandName: string | null;
    categoryId: string | null;
    filters: {
      brand_name: string | null;
      category_id: string | null;
    };
  };
  notes: string | null;
}

export interface StartApiRunStats {
  fetched: number;
  mapped: number;
  inserted: number;
  skipped_existing: number;
  errors: number;
  pages_processed: number;
  total_count: number;
  error_samples?: string[];
  run_endpoints_executed?: Array<string | Record<string, unknown>>;
}

export interface StartApiRunResponse {
  ok: boolean;
  run: {
    id: number;
    status: string;
  };
  stats: StartApiRunStats;
  message?: string;
  error_code?: string;
}
