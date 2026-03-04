export interface InventoryPolicy {
  id: string;
  name: string;
  description?: string;
  product_id?: string;
  category?: string;
  brand?: string;
  min_stock_level: number;
  max_stock_level: number;
  reorder_point: number;
  reorder_quantity: number;
  safety_stock: number;
  lead_time_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StockLevel {
  product_id: string;
  variant_id?: string;
  current_stock: number;
  reserved_stock: number;
  available_stock: number;
  incoming_stock: number;
  reorder_point: number;
  status: InventoryStatus;
  last_updated: string;
}

export enum InventoryStatus {
  HEALTHY = 'healthy',
  LOW = 'low',
  CRITICAL = 'critical',
  OVERSTOCK = 'overstock',
  OUT_OF_STOCK = 'out_of_stock',
}

export interface ReorderAlert {
  id: string;
  product_id: string;
  variant_id?: string;
  product_name: string;
  current_stock: number;
  reorder_point: number;
  suggested_quantity: number;
  priority: AlertPriority;
  created_at: string;
}

export enum AlertPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  variant_id?: string;
  movement_type: MovementType;
  quantity: number;
  reference?: string;
  notes?: string;
  created_at: string;
}

export enum MovementType {
  PURCHASE = 'purchase',
  SALE = 'sale',
  ADJUSTMENT = 'adjustment',
  RETURN = 'return',
  TRANSFER = 'transfer',
}
