export interface PricingPolicy {
  id: string;
  name: string;
  description?: string;
  rule_type: PricingRuleType;
  conditions: PricingCondition[];
  actions: PricingAction[];
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export enum PricingRuleType {
  MARKUP = 'markup',
  MARGIN = 'margin',
  FIXED_PRICE = 'fixed_price',
  COMPETITOR_BASED = 'competitor_based',
  DYNAMIC = 'dynamic',
}

export interface PricingCondition {
  field: string;
  operator: ConditionOperator;
  value: any;
}

export enum ConditionOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  CONTAINS = 'contains',
  IN = 'in',
  BETWEEN = 'between',
}

export interface PricingAction {
  type: PricingActionType;
  value: number;
  unit: PricingUnit;
}

export enum PricingActionType {
  ADD = 'add',
  SUBTRACT = 'subtract',
  MULTIPLY = 'multiply',
  SET = 'set',
}

export enum PricingUnit {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
}

export interface PricingSimulation {
  product_id: string;
  variant_id?: string;
  cost: number;
  base_price: number;
  applied_rules: AppliedRule[];
  final_price: number;
  margin: number;
  markup: number;
}

export interface AppliedRule {
  rule_id: string;
  rule_name: string;
  adjustment: number;
  result_price: number;
}
