export interface Offer {
  id: string;
  supplier_id: string;
  supplier_name: string;
  product_id: string;
  variant_id?: string;
  sku: string;
  supplier_sku: string;
  price: number;
  cost?: number;
  stock_quantity?: number;
  stock_status: StockStatus;
  lead_time_days?: number;
  min_order_quantity?: number;
  is_active: boolean;
  last_updated_run_id?: string;
  created_at: string;
  updated_at: string;
}

export enum StockStatus {
  IN_STOCK = 'in_stock',
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock',
  DISCONTINUED = 'discontinued',
  PREORDER = 'preorder',
}

export interface Winner {
  id: string;
  product_id: string;
  variant_id?: string;
  winning_offer_id: string;
  supplier_id: string;
  supplier_name: string;
  price: number;
  stock_quantity?: number;
  selection_reason: string;
  selected_at: string;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export interface OfferComparison {
  product_id: string;
  product_name: string;
  offers: Offer[];
  winner?: Winner;
  comparison_matrix: ComparisonMetric[];
}

export interface ComparisonMetric {
  metric: string;
  values: Record<string, any>;
}

export interface OfferQueryParams {
  supplier_id?: string;
  product_id?: string;
  stock_status?: StockStatus;
  is_active?: boolean;
  page?: number;
  per_page?: number;
}
