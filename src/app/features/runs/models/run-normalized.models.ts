export interface NormalizedItem {
  id: number;
  run_id: number;
  raw_id: number | null;
  oam_key: string;
  product_family: string;
  brand_name: string | null;
  model_code: string | null;
  color_code: string | null;
  size_lens: string | null;
  size_bridge: string | null;
  size_temple: string | null;
  size_std: string | null;
  supplier_sku: string | null;
  upc: string | null;
  cost: number | null;
  currency: string | null;
  available_qty: number | null;
  valid_state: string;
  quality_score: number;
  media?: {
    primary_image_signed_url?: string | null;
    gallery_signed_urls?: string[];
  };
  extra_attributes?: Record<string, unknown> | null;
  normalization_log?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface NormalizedRunSummary {
  id: number;
  run_key: string;
  status: string;
  supplier?: { id: number; code: string; name: string };
}

export interface NormalizedPaginatedResponse {
  run: NormalizedRunSummary;
  products: {
    data: NormalizedItem[];
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface NormalizedProductsQuery {
  page: number;
  per_page: number;
  search: string;
}

export interface NormalizedProductsPagination {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface NormalizedProductsResult {
  run: NormalizedRunSummary | null;
  data: NormalizedItem[];
  pagination: NormalizedProductsPagination;
}

interface LaravelNormalizedResponse {
  run?: unknown;
  products?: {
    data?: unknown[];
    current_page?: number;
    per_page?: number;
    total?: number;
    last_page?: number;
  };
}

const asNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const asNullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const asString = (value: unknown): string => String(value ?? '');

const asStringOrNull = (value: unknown): string | null => {
  if (value === null || value === undefined || value === '') return null;
  return String(value);
};

const asRecordOrNull = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

export function normalizeNormalizedItem(raw: unknown): NormalizedItem {
  const src = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const mediaRaw = src['media'] && typeof src['media'] === 'object' ? (src['media'] as Record<string, unknown>) : {};

  return {
    id: asNumber(src['id']),
    run_id: asNumber(src['run_id']),
    raw_id: asNullableNumber(src['raw_id']),
    oam_key: asString(src['oam_key']),
    product_family: asString(src['product_family']),
    brand_name: asStringOrNull(src['brand_name']),
    model_code: asStringOrNull(src['model_code']),
    color_code: asStringOrNull(src['color_code']),
    size_lens: asStringOrNull(src['size_lens']),
    size_bridge: asStringOrNull(src['size_bridge']),
    size_temple: asStringOrNull(src['size_temple']),
    size_std: asStringOrNull(src['size_std']),
    supplier_sku: asStringOrNull(src['supplier_sku']),
    upc: asStringOrNull(src['upc']),
    cost: asNullableNumber(src['cost']),
    currency: asStringOrNull(src['currency']),
    available_qty: asNullableNumber(src['available_qty']),
    valid_state: asString(src['valid_state']),
    quality_score: asNumber(src['quality_score']),
    media: {
      primary_image_signed_url: asStringOrNull(mediaRaw['primary_image_signed_url']),
      gallery_signed_urls: Array.isArray(mediaRaw['gallery_signed_urls'])
        ? mediaRaw['gallery_signed_urls'].map((item) => String(item))
        : [],
    },
    extra_attributes: asRecordOrNull(src['extra_attributes']),
    normalization_log: asRecordOrNull(src['normalization_log']),
    created_at: asString(src['created_at']),
    updated_at: asString(src['updated_at']),
  };
}

export function normalizeNormalizedRunSummary(raw: unknown): NormalizedRunSummary | null {
  if (!raw || typeof raw !== 'object') return null;
  const src = raw as Record<string, unknown>;
  const supplierRaw = src['supplier'] && typeof src['supplier'] === 'object'
    ? (src['supplier'] as Record<string, unknown>)
    : null;

  return {
    id: asNumber(src['id']),
    run_key: asString(src['run_key']),
    status: asString(src['status']),
    supplier: supplierRaw
      ? {
          id: asNumber(supplierRaw['id']),
          code: asString(supplierRaw['code']),
          name: asString(supplierRaw['name']),
        }
      : undefined,
  };
}

export function normalizeNormalizedProductsResponse(
  response: LaravelNormalizedResponse,
  query: NormalizedProductsQuery,
): NormalizedProductsResult {
  const products = response.products ?? {};

  return {
    run: normalizeNormalizedRunSummary(response.run),
    data: (products.data ?? []).map((item) => normalizeNormalizedItem(item)),
    pagination: {
      current_page: asNumber(products.current_page ?? query.page),
      per_page: asNumber(products.per_page ?? query.per_page),
      total: asNumber(products.total ?? 0),
      last_page: asNumber(products.last_page ?? 1),
    },
  };
}
