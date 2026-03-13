import {
  OamBrand,
  OamCollection,
  OamProductMaster,
  OamProductVariant,
} from '../../../../../core/models/product.model';

export type CrudMode = 'create' | 'edit' | 'show';

export type CrudFieldType =
  | 'text'
  | 'number'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'date'
  | 'email'
  | 'url'
  | 'hidden'
  | 'multiselect'
  | 'json'
  | 'tags';

export interface CrudOption<T = any> {
  label: string;
  value: T;
  disabled?: boolean;
  meta?: Record<string, any>;
}

export interface CrudFieldConfig<TModel = any> {
  key: keyof TModel | string;
  label: string;
  type: CrudFieldType;

  required?: boolean;
  readonly?: boolean;
  disabled?: boolean;
  hidden?: boolean;

  placeholder?: string;
  hint?: string;

  colSpan?: 1 | 2;
  rows?: number;
  options?: CrudOption[];

  multiple?: boolean;
  clearable?: boolean;

  /**
   * Para selects dependientes o lógica visual
   * Ej: brand_id -> collection_id
   */
  dependsOn?: keyof TModel | string;

  /**
   * Valor por defecto visual/config
   */
  defaultValue?: any;

  /**
   * Para campos que quieres mostrar en show
   * con un label distinto al valor plano
   */
  displayWith?: (value: any, model?: TModel) => string;

  /**
   * Para construir dinámicamente options
   * en base al modelo, contexto o catálogos
   */
  optionsResolver?: (context?: CrudContext<TModel>) => CrudOption[];

  /**
   * Control extra por modo
   */
  modes?: CrudMode[];

  /**
   * Clases utilitarias por si luego quieres más control visual
   */
  className?: string;
}

export interface CrudActionConfig {
  submitLabel?: string;
  cancelLabel?: string;
  closeLabel?: string;
  showCancelButton?: boolean;
  showSubmitButton?: boolean;
}

export interface CrudSectionConfig<TModel = any> {
  key: string;
  title?: string;
  description?: string;
  columns?: 1 | 2;
  fields: CrudFieldConfig<TModel>[];
}

export interface CrudCatalogs {
  brands?: OamBrand[];
  collections?: OamCollection[];
  productMasters?: OamProductMaster[];
  productVariants?: OamProductVariant[];
  [key: string]: any;
}

export interface CrudContext<TModel = any> {
  mode: CrudMode;
  model?: Partial<TModel> | null;
  catalogs?: CrudCatalogs;
  extra?: Record<string, any>;
}

export interface CrudConfig<TModel = any> {
  entity: 'brand' | 'collection' | 'product-master' | 'product-variant' | string;
  title: string;
  mode: CrudMode;

  columns?: 1 | 2;

  fields?: CrudFieldConfig<TModel>[];
  sections?: CrudSectionConfig<TModel>[];

  actions?: CrudActionConfig;

  catalogs?: CrudCatalogs;

  /**
   * Si luego quieres usar esto para show-crud
   * o para metadata adicional del header
   */
  meta?: Record<string, any>;
}

/* =========================
   TYPES ESPECÍFICOS OAM
========================= */

export type BrandFieldKey = keyof OamBrand;
export type CollectionFieldKey = keyof OamCollection;
export type ProductMasterFieldKey = keyof OamProductMaster;
export type ProductVariantFieldKey = keyof OamProductVariant;

export type BrandCrudFieldConfig = CrudFieldConfig<OamBrand>;
export type CollectionCrudFieldConfig = CrudFieldConfig<OamCollection>;
export type ProductMasterCrudFieldConfig = CrudFieldConfig<OamProductMaster>;
export type ProductVariantCrudFieldConfig = CrudFieldConfig<OamProductVariant>;

export type BrandCrudSectionConfig = CrudSectionConfig<OamBrand>;
export type CollectionCrudSectionConfig = CrudSectionConfig<OamCollection>;
export type ProductMasterCrudSectionConfig = CrudSectionConfig<OamProductMaster>;
export type ProductVariantCrudSectionConfig = CrudSectionConfig<OamProductVariant>;

export type BrandCrudConfig = CrudConfig<OamBrand>;
export type CollectionCrudConfig = CrudConfig<OamCollection>;
export type ProductMasterCrudConfig = CrudConfig<OamProductMaster>;
export type ProductVariantCrudConfig = CrudConfig<OamProductVariant>;
