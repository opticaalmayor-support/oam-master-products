export interface Supplier {
  id: string;
  code: string;
  name: string;
  priority: number;
  is_active: boolean;
  contact_email?: string;
  contact_phone?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SupplierStats {
  total_runs: number;
  total_products: number;
  active_offers: number;
  win_rate: number;
  last_run_date?: string;
}

export interface SupplierPriorityRule {
  id: string;
  supplier_id: string;
  category?: string;
  brand?: string;
  priority_boost: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
