export interface OamBrand {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  oam_collections?: OamCollection[];
  oam_product_masters?: OamProductMaster[];
}

export interface OamCollection {
  id: number;
  brand_id: number;
  name: string;
  slug: string;
  family_hint: string;
  is_active: boolean;
  meta?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  oam_brand?: OamBrand;
  oam_product_masters?: OamProductMaster[];
}

export interface OamProductMaster {
  id: number;
  upc?: string;
  oam_key: string;
  product_family: string;
  brand_id?: number;
  collection_id?: number;
  template_name: string;
  description_long?: string;
  description_short?: string;
  status: string;
  discontinued_at?: string;
  primary_image_url?: string;
  gallery_urls?: string[];
  gender: string;
  made_in?: string;
  attributes?: Record<string, any>;
  lens_features?: Record<string, any>;
  tags?: string[];
  created_by?: number;
  approved_by?: number;
  approved_at?: string;
  audit?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  oam_brand?: OamBrand;
  oam_collection?: OamCollection;
  oam_product_variants?: OamProductVariant[];
}

export interface OamProductVariant {
  id: number;
  product_master_id: number;
  internal_sku: string;
  barcode?: string;
  color_code?: string;
  color_description?: string;
  size_lens?: string;
  size_bridge?: string;
  size_temple?: string;
  size_std?: string;
  variant_attributes?: Record<string, any>;
  primary_image_url?: string;
  gallery_urls?: string[];
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  oam_product_master?: OamProductMaster;
  oam_inventory_snapshots?: OamInventorySnapshot[];
  oam_supplier_offers?: OamSupplierOffer[];
  oam_variant_winner?: OamVariantWinner;
}

export interface OamSupplier {
  id: number;
  code: string;
  name: string;
  supplier_type: string;
  is_active: boolean;
  default_currency: string;
  settings?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  oam_supplier_offers?: OamSupplierOffer[];
  oam_supplier_catalog_runs?: OamSupplierCatalogRun[];
}

export interface OamSupplierOffer {
  id: number;
  supplier_id: number;
  product_variant_id: number;
  supplier_product_id?: string;
  supplier_sku?: string;
  cost: number;
  currency: string;
  min_qty?: number;
  pack_qty?: number;
  lead_time_days?: number;
  available_qty?: number;
  last_seen_run_id?: number;
  last_seen_at?: string;
  offer_status: string;
  source?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  oam_supplier?: OamSupplier;
  oam_product_variant?: OamProductVariant;
  oam_supplier_catalog_run?: OamSupplierCatalogRun;
}

export interface OamVariantWinner {
  id: number;
  product_variant_id: number;
  selection_policy_id: number;
  winning_offer_id: number;
  computed_at: string;
  rationale?: Record<string, any>;
  is_locked: boolean;
  locked_by?: number;
  locked_at?: string;
  created_at?: string;
  updated_at?: string;
  oam_supplier_offer?: OamSupplierOffer;
  oam_supplier_selection_policy?: OamSupplierSelectionPolicy;
  oam_product_variant?: OamProductVariant;
}

export interface OamSupplierSelectionPolicy {
  id: number;
  name: string;
  description?: string;
  priority: number;
  rules?: Record<string, any>;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface OamSupplierCatalogRun {
  id: number;
  supplier_id: number;
  run_date: string;
  status: string;
  total_products?: number;
  new_products?: number;
  updated_products?: number;
  errors?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  oam_supplier?: OamSupplier;
}

export interface OamInventorySnapshot {
  id: number;
  product_variant_id: number;
  stock_source_id: number;
  quantity: number;
  snapshot_date: string;
  created_at?: string;
  updated_at?: string;
  oam_product_variant?: OamProductVariant;
  oam_stock_source?: OamStockSource;
}

export interface OamStockSource {
  id: number;
  name: string;
  code: string;
  source_type: string;
  is_active: boolean;
  settings?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface OamProductNormalized {
  id: number;
  supplier_id: number;
  supplier_product_raw_id: number;
  brand_id?: number;
  collection_id?: number;
  normalized_brand?: string;
  normalized_model?: string;
  normalized_color?: string;
  normalized_size?: string;
  normalized_upc?: string;
  confidence_score?: number;
  normalization_status: string;
  created_at?: string;
  updated_at?: string;
}

export interface OamProductMatch {
  id: number;
  product_normalized_id: number;
  product_variant_id: number;
  match_score: number;
  match_method: string;
  match_status: string;
  matched_by?: number;
  matched_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OamReviewQueue {
  id: number;
  entity_type: string;
  entity_id: number;
  issue_type: string;
  severity: string;
  description?: string;
  status: string;
  assigned_to?: number;
  resolved_by?: number;
  resolved_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProductQueryParams {
  search?: string;
  upc?: string;
  oam_key?: string;
  template_name?: string;
  brand_id?: number;
  collection_id?: number;
  product_family?: string;
  status?: string;
  gender?: string;
  made_in?: string;
  description_short?: string;
  description_long?: string;
  tags?: string;
  created_by?: number;
  approved_by?: number;
  approved_at_from?: string;
  approved_at_to?: string;
  is_discontinued?: boolean;
  has_primary_image?: boolean;
  has_gallery?: boolean;
  has_variants?: boolean;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface VariantQueryParams {
  search?: string;
  product_master_id?: number;
  internal_sku?: string;
  barcode?: string;
  color_code?: string;
  color_description?: string;
  size_lens?: string;
  size_bridge?: string;
  size_temple?: string;
  size_std?: string;
  is_active?: boolean;
  has_primary_image?: boolean;
  has_offers?: boolean;
  has_winner?: boolean;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface SupplierOfferQueryParams {
  supplier_id?: number;
  product_variant_id?: number;
  offer_status?: string;
  min_cost?: number;
  max_cost?: number;
  currency?: string;
  has_stock?: boolean;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}
