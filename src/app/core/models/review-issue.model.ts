export interface ReviewIssue {
  id: string;
  run_id: string;
  supplier_id: string;
  supplier_name: string;
  product_id?: string;
  variant_id?: string;
  sku: string;
  issue_type: IssueType;
  severity: IssueSeverity;
  status: ReviewStatus;
  description: string;
  current_data?: Record<string, any>;
  suggested_data?: Record<string, any>;
  resolution_notes?: string;
  assigned_to?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export enum IssueType {
  DUPLICATE_PRODUCT = 'duplicate_product',
  MISSING_ATTRIBUTE = 'missing_attribute',
  INVALID_PRICE = 'invalid_price',
  INVALID_STOCK = 'invalid_stock',
  NORMALIZATION_CONFLICT = 'normalization_conflict',
  IMAGE_MISSING = 'image_missing',
  CATEGORY_MISMATCH = 'category_mismatch',
  BRAND_MISMATCH = 'brand_mismatch',
  OTHER = 'other',
}

export enum IssueSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ReviewStatus {
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
  ESCALATED = 'escalated',
}

export interface ReviewDecision {
  issue_id: string;
  action: ReviewAction;
  resolution_data?: Record<string, any>;
  notes?: string;
}

export enum ReviewAction {
  APPROVE = 'approve',
  REJECT = 'reject',
  MODIFY = 'modify',
  ESCALATE = 'escalate',
  SKIP = 'skip',
}

export interface ReviewQueryParams {
  status?: ReviewStatus;
  issue_type?: IssueType;
  severity?: IssueSeverity;
  supplier_id?: string;
  assigned_to?: string;
  page?: number;
  per_page?: number;
}
