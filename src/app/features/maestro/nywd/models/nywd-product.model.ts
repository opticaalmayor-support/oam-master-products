export interface NywdRunSummary {
  id?: number;
  run_key?: string;
  supplier_id?: number;
  status?: string;
  started_at?: string | null;
  finished_at?: string | null;
  completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface NywdProductBase {
  sku: string | null;
  name: string | null;
  brand: string | null;
  category: string | null;
  price: number | null;
  quantity: number | null;
  [key: string]: unknown;
}

export interface NywdProductMedia {
  thumbnail_main_url: string | null;
  full_urls: string[];
  source_urls: string[];
}

export interface NywdProductItem {
  raw_id: number;
  base: NywdProductBase;
  attributes: Record<string, unknown>;
  media: NywdProductMedia;
}

export interface NywdProductsPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface NywdProductsResult {
  run: NywdRunSummary | null;
  data: NywdProductItem[];
  pagination: NywdProductsPagination;
}

export interface NywdLatestRunResult {
  runId: number | null;
}

const EMPTY_PAGINATION: NywdProductsPagination = {
  current_page: 1,
  last_page: 1,
  per_page: 25,
  total: 0,
};

export function normalizeNywdLatestRun(raw: unknown): NywdLatestRunResult {
  const src = asRecord(raw);
  const data = asRecord(src['data']);

  const candidate =
    src['id'] ??
    src['run_id'] ??
    src['latest_run_id'] ??
    data['id'] ??
    data['run_id'] ??
    data['latest_run_id'];
  const runId = Number(candidate);

  return {
    runId: Number.isFinite(runId) && runId > 0 ? runId : null,
  };
}

export function normalizeNywdProductsResponse(raw: unknown): NywdProductsResult {
  const src = asRecord(raw);
  const products = asRecord(src['products']);

  return {
    run: normalizeRun(src['run']),
    data: normalizeItems(products['data']),
    pagination: normalizePagination(products),
  };
}

export function normalizeNywdProductDetail(raw: unknown): NywdProductItem | null {
  const src = asRecord(raw);
  const payload = src['data'] ?? raw;

  return normalizeItem(payload);
}

function normalizeRun(raw: unknown): NywdRunSummary | null {
  const src = asRecord(raw);
  if (Object.keys(src).length === 0) {
    return null;
  }

  return src as NywdRunSummary;
}

function normalizeItems(raw: unknown): NywdProductItem[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((item) => normalizeItem(item))
    .filter((item): item is NywdProductItem => item !== null);
}

function normalizeItem(raw: unknown): NywdProductItem | null {
  const src = asRecord(raw);
  if (Object.keys(src).length === 0) {
    return null;
  }

  const rawId = Number(src['raw_id'] ?? src['id']);

  if (!Number.isFinite(rawId) || rawId <= 0) {
    return null;
  }

  return {
    raw_id: rawId,
    base: normalizeBase(src['base'], src),
    attributes: normalizeRecord(src['attributes']),
    media: normalizeMedia(src['media'], src['images_raw']),
  };
}

function normalizeBase(raw: unknown, flatSource: Record<string, unknown>): NywdProductBase {
  const src = asRecord(raw);

  if (Object.keys(src).length > 0) {
    const merged = { ...src };

    return {
      ...merged,
      sku: asString(src['sku']),
      name: asString(src['name']),
      brand: asString(src['brand']),
      category: asString(src['category']),
      price: asNumber(src['price']),
      quantity: asNumber(src['quantity']),
    };
  }

  const flat = flatSource;

  return {
    sku: asString(flat['sku'] ?? flat['supplier_sku']),
    name: asString(flat['name'] ?? flat['name_raw']),
    brand: asString(flat['brand'] ?? flat['brand_raw']),
    category: asString(flat['category'] ?? flat['family_raw']),
    price: asNumber(flat['price'] ?? flat['cost_raw']),
    quantity: asNumber(flat['quantity'] ?? flat['qty_raw']),
    model: asString(flat['model'] ?? flat['model_raw']),
    upc: asString(flat['upc'] ?? flat['upc_raw']),
    color: asString(flat['color'] ?? flat['color_raw']),
    size: asString(flat['size'] ?? flat['size_raw']),
    collection: asString(flat['collection'] ?? flat['collection_raw']),
    currency: asString(flat['currency'] ?? flat['currency_raw']),
  };
}

function normalizeMedia(raw: unknown, imagesRaw: unknown): NywdProductMedia {
  const src = asRecord(raw);
  const images = asRecord(imagesRaw);
  const fallbackFull = asStringArray(images['full']);
  const fallbackThumb = asString(images['thumbnail_main']) ?? fallbackFull[0] ?? null;

  const fullUrls = asStringArray(src['full_urls']);

  return {
    thumbnail_main_url: asString(src['thumbnail_main_url']) ?? fallbackThumb,
    full_urls: fullUrls.length > 0 ? fullUrls : fallbackFull,
    source_urls: asStringArray(src['source_urls']),
  };
}

function normalizePagination(raw: Record<string, unknown>): NywdProductsPagination {
  return {
    current_page: asPageInt(raw['current_page']) ?? EMPTY_PAGINATION.current_page,
    last_page: asPageInt(raw['last_page']) ?? EMPTY_PAGINATION.last_page,
    per_page: asPageInt(raw['per_page']) ?? EMPTY_PAGINATION.per_page,
    total: asNonNegativeInt(raw['total']) ?? EMPTY_PAGINATION.total,
  };
}

function normalizeRecord(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
}

function asString(raw: unknown): string | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const value = String(raw).trim();
  return value.length > 0 ? value : null;
}

function asNumber(raw: unknown): number | null {
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function asPageInt(raw: unknown): number | null {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed > 0 ? Math.trunc(parsed) : null;
}

function asNonNegativeInt(raw: unknown): number | null {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed >= 0 ? Math.trunc(parsed) : null;
}

function asStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((item) => asString(item))
    .filter((item): item is string => item !== null);
}

function asRecord(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
}
