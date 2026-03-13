import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, EMPTY } from 'rxjs';
import { switchMap, tap, catchError, takeUntil, debounceTime } from 'rxjs/operators';

import {
  OamBrand,
  OamCollection,
  OamProductMaster,
  OamProductVariant,
  ProductQueryParams,
} from '../../../../core/models/product.model';

import { OamBrandService } from '../../../../core/services/maestro/brand/OamBrand.service';
import { OamCollectionService } from '../../../../core/services/maestro/collection/OamCollection.service';

import { FilterProductPageComponent } from '../components/filters/filter-product-page.component';
import { CrudConfig } from '../components/crud/crud.types';
import { ProductService } from '../../../../core/services/maestro/productsMaster/OamProducts.service';
import { OamProductVariantService } from '../../../../core/services/maestro//productsVariant/OamProductVariant.service';
import { ProductMasterWorkspaceComponent } from '../components/product-master-workspace/product-master-workspace.component';
import { SidebarComponent } from '../components/Sidebar/sidebar.component';
import { ProductMasterTableComponent } from '../components/product-master-table/product-master-table.component';
import { SelectionToolbarComponent } from '../components/selection-toolbar/selection-toolbar';

import { COUNTRIES } from './countries';

type ProductListRequest = {
  type: 'list';
  filters: ProductQueryParams;
};

type ProductVariantsRequest = {
  type: 'variants';
  productId: number;
};

type ProductRequest = ProductListRequest | ProductVariantsRequest;
type CatalogMode = 'create' | 'edit' | 'show';

@Component({
  selector: 'app-products-list-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FilterProductPageComponent,
    ProductMasterWorkspaceComponent,
    SidebarComponent,
    ProductMasterTableComponent,
    SelectionToolbarComponent,
  ],
  templateUrl: './products-list-page.html',
  styleUrl: './products-list-page.scss',
})
export class ProductsListPage implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private productVariantService = inject(OamProductVariantService);
  private brandService = inject(OamBrandService);
  private collectionService = inject(OamCollectionService);

  private destroy$ = new Subject<void>();
  private productRequest$ = new Subject<ProductRequest>();

  public products = signal<OamProductMaster[]>([]);
  public productVariants = signal<OamProductVariant[]>([]);
  public brands = signal<OamBrand[]>([]);
  public collections = signal<OamCollection[]>([]);

  public selectedBrand = signal<OamBrand | null>(null);
  public selectedCollection = signal<OamCollection | null>(null);

  public brandMode = signal<CatalogMode>('create');
  public collectionMode = signal<CatalogMode>('create');

  public loading = signal<boolean>(false);
  public loadingProductVariants = signal<boolean>(false);

  public showForm = signal<boolean>(false);
  public isEditMode = signal<boolean>(false);
  public selectedProductId = signal<number | null>(null);
  public selectedVariantId = signal<number | null>(null);

  public currentFilters: ProductQueryParams = {};

  public selectedProductIds: number[] = [];
  public sequentialEditIds: number[] = [];
  public sequentialEditIndex = signal<number>(0);
  public sequentialEditActive = signal<boolean>(false);

  public productForm: FormGroup = this.fb.group({
    oam_key: ['', [Validators.required]],
    product_family: ['rx', [Validators.required]],
    template_name: ['', [Validators.required]],
    status: ['active', [Validators.required]],
    gender: ['unisex', [Validators.required]],
    upc: [''],
    brand_id: [null],
    collection_id: [null],
    description_short: [''],
    made_in: [''],
    attributes: this.fb.array([]),
    lens_features: this.fb.array([]),
    tags: this.fb.array([]),
    primary_image_url: [''],
    gallery_urls: this.fb.array([]),
  });

  public variantForm: FormGroup = this.fb.group({
    internal_sku: ['', [Validators.required]],
    barcode: [''],
    color_code: [''],
    color_description: [''],
    size_lens: [''],
    size_bridge: [''],
    size_temple: [''],
    size_std: [''],
    primary_image_url: [''],
    is_active: [true],
  });

  public productCreateConfig: CrudConfig<OamProductMaster> = {
    entity: 'product-master',
    title: 'Nuevo Product Master',
    mode: 'create',
    sections: [
      {
        key: 'general',
        title: 'Información General',
        description: 'Completa los datos principales del producto maestro.',
        columns: 2,
        fields: [
          {
            key: 'oam_key',
            label: 'OAM Key',
            type: 'text',
            required: true,
            colSpan: 2,
            placeholder: 'Ej: RAYBAN-RX123-BLK',
          },
          {
            key: 'product_family',
            label: 'Familia',
            type: 'select',
            required: true,
            options: [
              { label: 'RX', value: 'rx' },
              { label: 'SUN', value: 'sun' },
              { label: 'LENS', value: 'lens' },
              { label: 'Accessory', value: 'accessory' },
              { label: 'Other', value: 'other' },
            ],
          },
          {
            key: 'gender',
            label: 'Género',
            type: 'select',
            required: true,
            options: [
              { label: 'Men', value: 'men' },
              { label: 'Women', value: 'women' },
              { label: 'Unisex', value: 'unisex' },
              { label: 'Kids', value: 'kids' },
            ],
          },
          {
            key: 'status',
            label: 'Estado',
            type: 'select',
            required: true,
            options: [
              { label: 'Active', value: 'active' },
              { label: 'Draft', value: 'draft' },
              { label: 'Blocked', value: 'blocked' },
              { label: 'Discontinued', value: 'discontinued' },
            ],
          },
          {
            key: 'template_name',
            label: 'Template Name',
            type: 'text',
            required: true,
          },
          {
            key: 'upc',
            label: 'UPC / EAN',
            type: 'text',
          },
          {
            key: 'brand_id',
            label: 'Marca',
            type: 'select',
            options: [],
          },
          {
            key: 'collection_id',
            label: 'Colección',
            type: 'select',
            options: [],
          },
          {
            key: 'made_in',
            label: 'Made In',
            type: 'select',
            options: COUNTRIES.map((c) => ({ label: c, value: c })),
          },
          {
            key: 'description_short',
            label: 'Descripción Corta',
            type: 'textarea',
            colSpan: 2,
            rows: 3,
          },
        ],
      },
    ],
    actions: {
      submitLabel: 'Guardar Producto',
      cancelLabel: 'Cancelar',
    },
  };

  public productEditConfig: CrudConfig<OamProductMaster> = {
    entity: 'product-master',
    title: 'Editar Product Master',
    mode: 'edit',
    sections: [
      {
        key: 'general',
        title: 'Información General',
        description: 'Actualiza los datos principales del producto maestro.',
        columns: 2,
        fields: [
          {
            key: 'oam_key',
            label: 'OAM Key',
            type: 'text',
            required: true,
            colSpan: 2,
            placeholder: 'Ej: RAYBAN-RX123-BLK',
          },
          {
            key: 'product_family',
            label: 'Familia',
            type: 'select',
            required: true,
            options: [
              { label: 'RX', value: 'rx' },
              { label: 'SUN', value: 'sun' },
              { label: 'LENS', value: 'lens' },
              { label: 'Accessory', value: 'accessory' },
              { label: 'Other', value: 'other' },
            ],
          },
          {
            key: 'gender',
            label: 'Género',
            type: 'select',
            required: true,
            options: [
              { label: 'Men', value: 'men' },
              { label: 'Women', value: 'women' },
              { label: 'Unisex', value: 'unisex' },
              { label: 'Kids', value: 'kids' },
            ],
          },
          {
            key: 'status',
            label: 'Estado',
            type: 'select',
            required: true,
            options: [
              { label: 'Active', value: 'active' },
              { label: 'Draft', value: 'draft' },
              { label: 'Blocked', value: 'blocked' },
              { label: 'Discontinued', value: 'discontinued' },
            ],
          },
          {
            key: 'template_name',
            label: 'Template Name',
            type: 'text',
            required: true,
          },
          {
            key: 'upc',
            label: 'UPC / EAN',
            type: 'text',
          },
          {
            key: 'brand_id',
            label: 'Marca',
            type: 'select',
            options: [],
          },
          {
            key: 'collection_id',
            label: 'Colección',
            type: 'select',
            options: [],
          },
          {
            key: 'description_short',
            label: 'Descripción Corta',
            type: 'textarea',
            colSpan: 2,
            rows: 3,
          },
          {
            key: 'made_in',
            label: 'Made In',
            type: 'text',
            colSpan: 2,
          },
        ],
      },
    ],
    actions: {
      submitLabel: 'Actualizar Producto',
      cancelLabel: 'Cancelar',
    },
  };

  ngOnInit(): void {
    this.initProductRequests();
    this.loadProducts();
    this.loadCatalogs();

    this.productForm
      .get('brand_id')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((brandId) => {
        const currentCollectionId = this.productForm.get('collection_id')?.value;

        const validCollections = this.collections().filter(
          (collection) => collection.brand_id === brandId,
        );

        const isCurrentCollectionValid = validCollections.some(
          (collection) => collection.id === currentCollectionId,
        );

        if (!isCurrentCollectionValid) {
          this.productForm.patchValue({ collection_id: null }, { emitEvent: false });
        }

        if (validCollections.length === 1) {
          this.productForm.patchValue(
            { collection_id: validCollections[0].id },
            { emitEvent: false },
          );
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get computedProductCreateConfig(): CrudConfig<OamProductMaster> {
    return this.buildProductConfig(this.productCreateConfig);
  }

  get computedProductEditConfig(): CrudConfig<OamProductMaster> {
    return this.buildProductConfig(this.productEditConfig);
  }

  get collectionsForSelectedBrand(): OamCollection[] {
    const brandId = this.productForm.get('brand_id')?.value;
    if (!brandId) return [];
    return this.collections()
      .filter((collection) => collection.brand_id === brandId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private initProductRequests(): void {
    this.productRequest$
      .pipe(
        debounceTime(150),
        switchMap((request) => {
          if (request.type === 'list') {
            this.loading.set(true);

            return this.productService.getProducts(request.filters).pipe(
              tap((response: any) => {
                this.products.set(response?.data || []);
                this.loading.set(false);
              }),
              catchError((error) => {
                console.error('Error al cargar productos:', error);
                this.loading.set(false);
                return EMPTY;
              }),
            );
          }

          this.loadingProductVariants.set(true);

          return this.productVariantService
            .getVariants({ product_master_id: request.productId })
            .pipe(
              tap((response: any) => {
                this.productVariants.set(response?.data || []);
                this.loadingProductVariants.set(false);
              }),
              catchError((error) => {
                console.error('Error al cargar variantes del producto:', error);
                this.productVariants.set([]);
                this.loadingProductVariants.set(false);
                return EMPTY;
              }),
            );
        }),
        takeUntil(this.destroy$),
      )
      .subscribe();
  }

  private buildProductConfig(
    baseConfig: CrudConfig<OamProductMaster>,
  ): CrudConfig<OamProductMaster> {
    return {
      ...baseConfig,
      sections: baseConfig.sections?.map((section) => ({
        ...section,
        fields: section.fields.map((field) => {
          if (field.key === 'brand_id') {
            return {
              ...field,
              options: this.brands().map((brand) => ({
                label: brand.name,
                value: brand.id,
              })),
            };
          }

          if (field.key === 'collection_id') {
            const selectedBrandId = this.productForm.get('brand_id')?.value;

            return {
              ...field,
              options: this.collections()
                .filter((collection) => !selectedBrandId || collection.brand_id === selectedBrandId)
                .map((collection) => ({
                  label: collection.name,
                  value: collection.id,
                })),
            };
          }

          return field;
        }),
      })),
    };
  }

  loadProducts(): void {
    this.productRequest$.next({
      type: 'list',
      filters: this.currentFilters,
    });
  }

  loadCatalogs(): void {
    this.brandService.getBrands().subscribe({
      next: (response: any) => {
        const brands = response?.data || response || [];
        this.brands.set(brands);
      },
      error: (error) => {
        console.error('Error loading brands:', error);
      },
    });

    this.collectionService.getCollections({ is_active: 1 }).subscribe({
      next: (response: any) => {
        const collections = response?.data || response || [];
        this.collections.set(collections);
      },
      error: (error) => {
        console.error('Error loading collections:', error);
      },
    });
  }

  loadProductVariants(productId: number): void {
    this.productRequest$.next({
      type: 'variants',
      productId,
    });
  }

  onUpdateFilters(filters: Record<string, any>): void {
    this.currentFilters = filters;
    this.loadProducts();
  }

  openCreateForm(): void {
    this.selectedVariantId.set(null);
    this.isEditMode.set(false);
    this.selectedProductId.set(null);
    this.productVariants.set([]);

    this.productForm.reset({
      oam_key: '',
      product_family: 'rx',
      template_name: '',
      status: 'active',
      gender: 'unisex',
      upc: '',
      brand_id: null,
      collection_id: null,
      description_short: '',
      made_in: '',
      attributes: {},
      lens_features: {},
      tags: [],
      primary_image_url: '',
      gallery_urls: [],
    });

    this.variantForm.reset({
      internal_sku: '',
      barcode: '',
      color_code: '',
      color_description: '',
      size_lens: '',
      size_bridge: '',
      size_temple: '',
      size_std: '',
      primary_image_url: '',
      is_active: true,
    });

    this.resetBrandEditor();
    this.resetCollectionEditor();

    this.showForm.set(true);
  }

  editProduct(product: OamProductMaster): void {
    this.isEditMode.set(true);
    this.selectedVariantId.set(null);
    this.selectedProductId.set(product.id);

    this.productForm.patchValue({
      oam_key: product.oam_key,
      product_family: product.product_family,
      template_name: product.template_name,
      status: product.status,
      gender: product.gender,
      upc: product.upc || '',
      brand_id: product.brand_id || null,
      collection_id: product.collection_id || null,
      description_short: product.description_short || '',
      made_in: product.made_in || '',
      attributes: product.attributes || {},
      lens_features: product.lens_features || {},
      tags: product.tags || [],
      primary_image_url: product.primary_image_url || '',
      gallery_urls: product.gallery_urls || [],
    });

    this.variantForm.reset({
      internal_sku: '',
      barcode: '',
      color_code: '',
      color_description: '',
      size_lens: '',
      size_bridge: '',
      size_temple: '',
      size_std: '',
      primary_image_url: '',
      is_active: true,
    });

    this.resetBrandEditor();
    this.resetCollectionEditor();

    this.loadProductVariants(product.id);
    this.showForm.set(true);
  }

  editProductVariant(variant: OamProductVariant): void {
    this.selectedVariantId.set(variant.id);

    this.variantForm.patchValue({
      internal_sku: variant.internal_sku || '',
      barcode: variant.barcode || '',
      color_code: variant.color_code || '',
      color_description: variant.color_description || '',
      size_lens: variant.size_lens || '',
      size_bridge: variant.size_bridge || '',
      size_temple: variant.size_temple || '',
      size_std: variant.size_std || '',
      primary_image_url: variant.primary_image_url || '',
      is_active: variant.is_active ?? true,
    });
  }

  closeForm(): void {
    this.selectedVariantId.set(null);
    this.showForm.set(false);
    this.isEditMode.set(false);
    this.selectedProductId.set(null);
    this.productVariants.set([]);

    this.productForm.reset({
      oam_key: '',
      product_family: 'rx',
      template_name: '',
      status: 'active',
      gender: 'unisex',
      upc: '',
      brand_id: null,
      collection_id: null,
      description_short: '',
      made_in: '',
      attributes: {},
      lens_features: {},
      tags: [],
      primary_image_url: '',
      gallery_urls: [],
    });

    this.variantForm.reset({
      internal_sku: '',
      barcode: '',
      color_code: '',
      color_description: '',
      size_lens: '',
      size_bridge: '',
      size_temple: '',
      size_std: '',
      primary_image_url: '',
      is_active: true,
    });

    this.resetBrandEditor();
    this.resetCollectionEditor();

    if (this.sequentialEditActive()) {
      this.cancelSequentialEdit();
    }
  }

  onSaveProduct(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const payload = this.productForm.getRawValue();

    if (this.isEditMode() && this.selectedProductId()) {
      this.productService.updateProduct(this.selectedProductId()!, payload).subscribe({
        next: () => {
          this.loadProducts();
          this.loadProductVariants(this.selectedProductId()!);

          if (this.sequentialEditActive()) {
            this.goToNextSequentialProduct();
          }
        },
        error: (error: any) => {
          console.error('Error al actualizar producto:', error);
        },
      });
      return;
    }

    this.productService.createProduct(payload).subscribe({
      next: (response: any) => {
        const newProductId = response?.data?.id ?? response?.id ?? null;

        if (newProductId) {
          this.selectedProductId.set(newProductId);
          this.isEditMode.set(true);
          this.loadProductVariants(newProductId);
        }

        this.loadProducts();
      },
      error: (error: any) => {
        console.error('Error al crear producto:', error);
      },
    });
  }

  canManageVariants(): boolean {
    return !!this.selectedProductId();
  }

  resetVariantForm(): void {
    this.selectedVariantId.set(null);

    this.variantForm.reset({
      internal_sku: '',
      barcode: '',
      color_code: '',
      color_description: '',
      size_lens: '',
      size_bridge: '',
      size_temple: '',
      size_std: '',
      primary_image_url: '',
      is_active: true,
    });
  }

  onSaveVariant(): void {
    if (!this.selectedProductId()) {
      console.warn('Debes guardar primero el Product Master.');
      return;
    }

    if (this.variantForm.invalid) {
      this.variantForm.markAllAsTouched();
      return;
    }

    const payload: Partial<OamProductVariant> = {
      product_master_id: this.selectedProductId()!,
      ...this.variantForm.getRawValue(),
    };

    if (this.selectedVariantId()) {
      this.productVariantService.updateVariant(this.selectedVariantId()!, payload).subscribe({
        next: () => {
          this.resetVariantForm();
          this.loadProductVariants(this.selectedProductId()!);
        },
        error: (error: any) => {
          console.error('Error al actualizar variante:', error);
        },
      });
      return;
    }

    this.productVariantService.createVariant(payload).subscribe({
      next: () => {
        this.resetVariantForm();
        this.loadProductVariants(this.selectedProductId()!);
      },
      error: (error: any) => {
        console.error('Error al crear variante:', error);
      },
    });
  }

  deleteProduct(productId: number): void {
    const confirmed = confirm('¿Seguro que deseas eliminar este producto master?');
    if (!confirmed) return;

    this.productService.deleteProduct(productId).subscribe({
      next: () => {
        this.products.update((current) => current.filter((item) => item.id !== productId));
        this.selectedProductIds = this.selectedProductIds.filter((id) => id !== productId);
      },
      error: (error: any) => {
        console.error('Error al eliminar producto:', error);
      },
    });
  }

  deleteProductVariant(variantId: number): void {
    const confirmed = confirm('¿Seguro que deseas eliminar esta variante?');
    if (!confirmed) return;

    this.productVariantService.deleteVariant(variantId).subscribe({
      next: () => {
        this.productVariants.update((current) => current.filter((item) => item.id !== variantId));

        if (this.selectedVariantId() === variantId) {
          this.resetVariantForm();
        }
      },
      error: (error: any) => {
        console.error('Error al eliminar variante:', error);
      },
    });
  }

  onBrandSubmitted(payload: Partial<OamBrand>): void {
    if (this.brandMode() === 'edit' && this.selectedBrand()) {
      this.brandService.updateBrand(this.selectedBrand()!.id, payload).subscribe({
        next: (response: any) => {
          const updatedBrand: OamBrand = response?.data ?? response;

          this.brands.update((current) =>
            current.map((brand) => (brand.id === updatedBrand.id ? updatedBrand : brand)),
          );

          if (this.productForm.get('brand_id')?.value === updatedBrand.id) {
            this.productForm.patchValue({ brand_id: updatedBrand.id }, { emitEvent: false });
          }

          this.resetBrandEditor();
        },
        error: (error: any) => {
          console.error('Error al actualizar marca:', error);
        },
      });
      return;
    }

    this.brandService.createBrand(payload).subscribe({
      next: (response: any) => {
        const newBrand: OamBrand = response?.data ?? response;

        this.brands.update((current) =>
          [...current, newBrand].sort((a, b) => a.name.localeCompare(b.name)),
        );

        this.productForm.patchValue({
          brand_id: newBrand.id,
          collection_id: null,
        });

        this.resetBrandEditor();
      },
      error: (error: any) => {
        console.error('Error al crear marca:', error);
      },
    });
  }

  onCollectionSubmitted(payload: Partial<OamCollection>): void {
    const selectedBrandId = this.productForm.get('brand_id')?.value;

    const finalPayload = {
      ...payload,
      brand_id: payload.brand_id ?? selectedBrandId ?? null,
    };

    if (this.collectionMode() === 'edit' && this.selectedCollection()) {
      this.collectionService
        .updateCollection(this.selectedCollection()!.id, finalPayload)
        .subscribe({
          next: (response: any) => {
            const updatedCollection: OamCollection = response?.data ?? response;

            this.collections.update((current) =>
              current.map((collection) =>
                collection.id === updatedCollection.id ? updatedCollection : collection,
              ),
            );

            if (this.productForm.get('collection_id')?.value === updatedCollection.id) {
              this.productForm.patchValue(
                {
                  brand_id: updatedCollection.brand_id,
                  collection_id: updatedCollection.id,
                },
                { emitEvent: false },
              );
            }

            this.resetCollectionEditor();
          },
          error: (error: any) => {
            console.error('Error al actualizar colección:', error);
          },
        });
      return;
    }

    this.collectionService.createCollection(finalPayload).subscribe({
      next: (response: any) => {
        const newCollection: OamCollection = response?.data ?? response;

        this.collections.update((current) =>
          [...current, newCollection].sort((a, b) => a.name.localeCompare(b.name)),
        );

        this.productForm.patchValue({
          brand_id: newCollection.brand_id,
          collection_id: newCollection.id,
        });

        this.resetCollectionEditor();
      },
      error: (error: any) => {
        console.error('Error al crear colección:', error);
      },
    });
  }

  startCreateBrand(): void {
    this.resetBrandEditor();
  }

  startEditBrand(brand: OamBrand): void {
    this.selectedBrand.set(brand);
    this.brandMode.set('edit');
  }

  showBrand(brand: OamBrand): void {
    this.selectedBrand.set(brand);
    this.brandMode.set('show');
  }

  deleteBrand(brand: OamBrand): void {
    const hasCollections = this.collections().some(
      (collection) => collection.brand_id === brand.id,
    );

    if (hasCollections) {
      alert('No puedes eliminar esta marca porque tiene colecciones asociadas.');
      return;
    }

    const confirmed = confirm(`¿Seguro que deseas eliminar la marca "${brand.name}"?`);
    if (!confirmed) return;

    this.brandService.deleteBrand(brand.id).subscribe({
      next: () => {
        this.brands.update((current) => current.filter((item) => item.id !== brand.id));

        if (this.productForm.get('brand_id')?.value === brand.id) {
          this.productForm.patchValue({
            brand_id: null,
            collection_id: null,
          });
        }

        if (this.selectedBrand()?.id === brand.id) {
          this.resetBrandEditor();
        }
      },
      error: (error: any) => {
        console.error('Error al eliminar marca:', error);
      },
    });
  }

  startCreateCollection(): void {
    this.resetCollectionEditor();
  }

  startEditCollection(collection: OamCollection): void {
    this.selectedCollection.set(collection);
    this.collectionMode.set('edit');
  }

  showCollection(collection: OamCollection): void {
    this.selectedCollection.set(collection);
    this.collectionMode.set('show');
  }

  deleteCollection(collection: OamCollection): void {
    if (this.productForm.get('collection_id')?.value === collection.id) {
      const confirmedSelected = confirm(
        `La colección "${collection.name}" está seleccionada en el formulario actual. ¿Deseas eliminarla?`,
      );
      if (!confirmedSelected) return;
    } else {
      const confirmed = confirm(`¿Seguro que deseas eliminar la colección "${collection.name}"?`);
      if (!confirmed) return;
    }

    this.collectionService.deleteCollection(collection.id).subscribe({
      next: () => {
        this.collections.update((current) => current.filter((item) => item.id !== collection.id));

        if (this.productForm.get('collection_id')?.value === collection.id) {
          this.productForm.patchValue({ collection_id: null });
        }

        if (this.selectedCollection()?.id === collection.id) {
          this.resetCollectionEditor();
        }
      },
      error: (error: any) => {
        console.error('Error al eliminar colección:', error);
      },
    });
  }

  onProductSelectionChange(ids: number[]): void {
    this.selectedProductIds = ids;
  }

  clearProductSelection(): void {
    this.selectedProductIds = [];
  }

  editSelectedProduct(): void {
    if (this.selectedProductIds.length === 0) {
      return;
    }

    if (this.selectedProductIds.length > 1) {
      this.startSequentialEdit();
      return;
    }

    const selectedId = this.selectedProductIds[0];
    const product = this.products().find((item) => item.id === selectedId);

    if (!product) {
      return;
    }

    this.editProduct(product);
  }

  startSequentialEdit(): void {
    if (this.selectedProductIds.length === 0) {
      return;
    }

    if (this.selectedProductIds.length === 1) {
      this.editSelectedProduct();
      return;
    }

    this.sequentialEditIds = [...this.selectedProductIds];
    this.sequentialEditIndex.set(0);
    this.sequentialEditActive.set(true);

    this.openSequentialProductByIndex();
  }

  private openSequentialProductByIndex(): void {
    const currentId = this.sequentialEditIds[this.sequentialEditIndex()];

    if (!currentId) {
      this.finishSequentialEdit();
      return;
    }

    const product = this.products().find((item) => item.id === currentId);

    if (!product) {
      this.goToNextSequentialProduct();
      return;
    }

    this.editProduct(product);
  }

  goToNextSequentialProduct(): void {
    const nextIndex = this.sequentialEditIndex() + 1;

    if (nextIndex >= this.sequentialEditIds.length) {
      this.finishSequentialEdit();
      return;
    }

    this.sequentialEditIndex.set(nextIndex);
    this.openSequentialProductByIndex();
  }

  skipSequentialProduct(): void {
    if (!this.sequentialEditActive()) {
      return;
    }

    this.goToNextSequentialProduct();
  }

  cancelSequentialEdit(): void {
    this.sequentialEditIds = [];
    this.sequentialEditIndex.set(0);
    this.sequentialEditActive.set(false);
  }

  private finishSequentialEdit(): void {
    this.cancelSequentialEdit();
    this.clearProductSelection();
    this.closeForm();
  }

  get sequentialEditCurrentStep(): number {
    return this.sequentialEditIndex() + 1;
  }

  get sequentialEditTotal(): number {
    return this.sequentialEditIds.length;
  }

  deleteSelectedProducts(): void {
    if (this.selectedProductIds.length === 0) {
      return;
    }

    const confirmed = confirm(
      `¿Seguro que deseas eliminar ${this.selectedProductIds.length} productos seleccionados?`,
    );

    if (!confirmed) {
      return;
    }

    const idsToDelete = [...this.selectedProductIds];

    idsToDelete.forEach((id) => {
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          this.products.update((current) => current.filter((item) => item.id !== id));
        },
        error: (error: any) => {
          console.error(`Error al eliminar producto ${id}:`, error);
        },
      });
    });

    this.selectedProductIds = [];
  }

  onInlineSaveProduct(event: {
    id: number;
    field: 'oam_key' | 'template_name' | 'status';
    value: string;
  }): void {
    if (this.sequentialEditActive()) {
      return;
    }

    const current = this.products().find((item) => item.id === event.id);

    if (!current) {
      return;
    }

    const payload: Partial<OamProductMaster> = {
      oam_key: event.field === 'oam_key' ? event.value : (current.oam_key ?? ''),
      product_family: current.product_family ?? 'rx',
      template_name: event.field === 'template_name' ? event.value : (current.template_name ?? ''),
      status: event.field === 'status' ? event.value : (current.status ?? 'active'),
      gender: current.gender ?? 'unisex',
      upc: current.upc ?? '',
      brand_id: current.brand_id ?? undefined,
      collection_id: current.collection_id ?? undefined,
      description_short: current.description_short ?? '',
      made_in: current.made_in ?? '',
      attributes: current.attributes ?? [],
      lens_features: current.lens_features ?? [],
      tags: current.tags ?? [],
      primary_image_url: current.primary_image_url ?? '',
      gallery_urls: current.gallery_urls ?? [],
    };

    this.productService.updateProduct(event.id, payload).subscribe({
      next: () => {
        this.products.update((items) =>
          items.map((item) =>
            item.id === event.id
              ? {
                  ...item,
                  [event.field]: event.value,
                }
              : item,
          ),
        );
      },
      error: (error: any) => {
        console.error(`Error actualizando ${event.field} del producto ${event.id}:`, error);
      },
    });
  }

  private resetBrandEditor(): void {
    this.selectedBrand.set(null);
    this.brandMode.set('create');
  }

  private resetCollectionEditor(): void {
    this.selectedCollection.set(null);
    this.collectionMode.set('create');
  }
}
