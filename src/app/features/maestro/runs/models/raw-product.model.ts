import { CatalogRun } from './run.model';

export interface RawProductImages {
  full: string[];
  thumbnail_main: string | null;
}

export interface RawProductMedia {
  thumbnail_main_url: string | null;
  full_urls: string[];
}

export interface RawProduct {
  id: number;
  run_id: number;
  supplier_id: number;
  supplier_product_id: string | null;
  supplier_sku: string | null;
  upc_raw: string | null;
  name_raw: string | null;
  model_raw: string | null;
  brand_raw: string | null;
  collection_raw: string | null;
  family_raw: string | null;
  color_raw: string | null;
  size_raw: string | null;
  cost_raw: string | null;
  currency_raw: string | null;
  qty_raw: string | null;
  images_raw: RawProductImages;
  media: RawProductMedia;
  raw_payload: unknown;
  created_at: string;
  updated_at: string;
}

export interface RawProductsQuery {
  page: number;
  per_page: number;
  search: string;
}

export interface RawProductsPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface RawProductsResult {
  run?: CatalogRun;
  data: RawProduct[];
  pagination: RawProductsPagination;
}

export interface LaravelRawProductsResponse {
  run?: CatalogRun;
  products?: {
    data?: unknown[];
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
  };
}

export function normalizeRawProductImages(raw: unknown): RawProductImages {
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const full = Array.isArray(source['full']) ? source['full'].map(item => String(item)) : [];
  const thumbnail = source['thumbnail_main'];

  return {
    full,
    thumbnail_main: typeof thumbnail === 'string' && thumbnail.length > 0 ? thumbnail : null,
  };
}

export function normalizeRawProductMedia(raw: unknown): RawProductMedia {
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const thumbnail = source['thumbnail_main_url'];
  const fullUrls = Array.isArray(source['full_urls'])
    ? source['full_urls'].map(item => String(item))
    : [];

  return {
    thumbnail_main_url: typeof thumbnail === 'string' && thumbnail.length > 0 ? thumbnail : null,
    full_urls: fullUrls,
  };
}

export function normalizeRawProduct(raw: unknown): RawProduct {
  const src = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};

  const asNumber = (value: unknown): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const asStringOrNull = (value: unknown): string | null => {
    if (value === null || value === undefined || value === '') return null;
    return String(value);
  };

  return {
    id: asNumber(src['id']),
    run_id: asNumber(src['run_id']),
    supplier_id: asNumber(src['supplier_id']),
    supplier_product_id: asStringOrNull(src['supplier_product_id']),
    supplier_sku: asStringOrNull(src['supplier_sku']),
    upc_raw: asStringOrNull(src['upc_raw']),
    name_raw: asStringOrNull(src['name_raw']),
    model_raw: asStringOrNull(src['model_raw']),
    brand_raw: asStringOrNull(src['brand_raw']),
    collection_raw: asStringOrNull(src['collection_raw']),
    family_raw: asStringOrNull(src['family_raw']),
    color_raw: asStringOrNull(src['color_raw']),
    size_raw: asStringOrNull(src['size_raw']),
    cost_raw: asStringOrNull(src['cost_raw']),
    currency_raw: asStringOrNull(src['currency_raw']),
    qty_raw: asStringOrNull(src['qty_raw']),
    images_raw: normalizeRawProductImages(src['images_raw']),
    media: normalizeRawProductMedia(src['media']),
    raw_payload: src['raw_payload'] ?? null,
    created_at: asStringOrNull(src['created_at']) ?? '',
    updated_at: asStringOrNull(src['updated_at']) ?? '',
  };
}
