export type RunStatus =
  | 'created'
  | 'pending'
  | 'init'
  | 'loaded'
  | 'completed'
  | 'normalized'
  | 'matched'
  | 'offers_built'
  | 'winner_selected'
  | 'winner'
  | 'published'
  | 'failed';

export interface RunSupplierRef {
  id: number;
  name: string;
  code: string;
}

export interface RunStats {
  total: number;
  total_count?: number;
  inserted: number;
  skipped: number;
  fetched?: number;
  mapped?: number;
  skipped_existing?: number;
  skipped_duplicates?: number;
  pages_processed?: number;
  successful_endpoints?: number;
  failed_endpoints?: number;
  errors: number;
  purpose?: string | null;
  execution_mode?: string | null;
  merge_strategy?: string | null;
  error_samples: string[];
}

export interface CatalogRun {
  id: number;
  supplier_id: number;
  run_key: string;
  source_type: string;
  source_uri: string;
  status: string;
  stats: RunStats;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  oam_supplier_product_raws_count?: number;
  oam_supplier_run_item_snapshots_count?: number;
  trace_count?: number;
  oam_product_normalizeds_count?: number;
  oam_supplier?: RunSupplierRef;
  supplier?: RunSupplierRef;
  trace_preview?: unknown[];
}

export interface RunsListQuery {
  page?: number;
  per_page?: number;
  supplier_id?: number | null;
  status?: string | null;
  run_key?: string | null;
}

export interface RunsPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface RunsListResult {
  data: CatalogRun[];
  pagination: RunsPagination;
}

export interface LaravelPaginatedResponse<T> {
  current_page: number;
  data: T[];
  last_page: number;
  per_page: number;
  total: number;
}

export function normalizeRunStats(raw: unknown): RunStats {
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};

  const toNumber = (value: unknown): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const errorSamplesRaw = source['error_samples'];
  const errorSamples = Array.isArray(errorSamplesRaw)
    ? errorSamplesRaw.map(item => String(item))
    : [];

  const totalCount = toNumber(source['total_count']);
  const fetched = toNumber(source['fetched']);
  const total = toNumber(source['total']) || totalCount || fetched;
  const skippedExisting = toNumber(source['skipped_existing']);
  const skipped = toNumber(source['skipped']) || skippedExisting;

  return {
    total,
    total_count: totalCount,
    inserted: toNumber(source['inserted']),
    skipped,
    fetched,
    mapped: toNumber(source['mapped']),
    skipped_existing: skippedExisting,
    skipped_duplicates: toNumber(source['skipped_duplicates']),
    pages_processed: toNumber(source['pages_processed']),
    successful_endpoints: toNumber(source['successful_endpoints']),
    failed_endpoints: toNumber(source['failed_endpoints']),
    errors: toNumber(source['errors']),
    purpose: source['purpose'] ? String(source['purpose']) : null,
    execution_mode: source['execution_mode'] ? String(source['execution_mode']) : null,
    merge_strategy: source['merge_strategy'] ? String(source['merge_strategy']) : null,
    error_samples: errorSamples,
  };
}
