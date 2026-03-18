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
  inserted: number;
  skipped: number;
  errors: number;
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
  oam_product_normalizeds_count?: number;
  oam_supplier?: RunSupplierRef;
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

  return {
    total: toNumber(source['total']),
    inserted: toNumber(source['inserted']),
    skipped: toNumber(source['skipped']),
    errors: toNumber(source['errors']),
    error_samples: errorSamples,
  };
}
