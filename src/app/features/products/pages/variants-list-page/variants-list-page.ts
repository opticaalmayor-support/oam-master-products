import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, EMPTY, firstValueFrom } from 'rxjs';
import { switchMap, tap, catchError, takeUntil, debounceTime } from 'rxjs/operators';

import { OamProductVariant, VariantQueryParams } from '../../../../core/models/product.model';

import { FilterProductPageComponent } from '../components/filters/filter-product-page.component';
import { OamProductVariantService } from '../../../../core/services/maestro/productsVariant/OamProductVariant.service';
import { EditCrudComponent } from '../components/crud/edit-crud/edit-crud.component';
import { SidebarComponent } from '../components/Sidebar/sidebar.component';
import { CrudConfig } from '../components/crud/crud.types';
import { SelectionToolbarComponent } from '../components/selection-toolbar/selection-toolbar';
import { ProductVariantTableComponent } from '../components/product-variant-table/product-variant-table.component';

type VariantInlineEditEvent = {
  id: number;
  field: 'internal_sku' | 'barcode' | 'color_description' | 'size_std' | 'is_active';
  value: string;
};

type VariantTableColumnKey =
  | 'id'
  | 'thumbnail'
  | 'internal_sku'
  | 'barcode'
  | 'color_code'
  | 'color_description'
  | 'size_lens'
  | 'size_bridge'
  | 'size_temple'
  | 'size_std'
  | 'product_master_id'
  | 'is_active';

@Component({
  selector: 'app-variants-list-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FilterProductPageComponent,
    EditCrudComponent,
    SidebarComponent,
    SelectionToolbarComponent,
    ProductVariantTableComponent,
  ],
  templateUrl: './variants-list-page.html',
  styleUrl: './variants-list-page.scss',
})
export class VariantsListPage implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private variantService = inject(OamProductVariantService);

  private destroy$ = new Subject<void>();
  private variantsRequest$ = new Subject<VariantQueryParams>();

  // Define columnas base siempre visibles en la tabla de variantes.
  private readonly defaultVariantColumns: VariantTableColumnKey[] = [
    'id',
    'thumbnail',
    'internal_sku',
    'barcode',
    'color_description',
    'size_std',
    'is_active',
  ];

  // Mapea filtros activos a columnas de tabla para mostrar contexto.
  private readonly variantFilterColumnMap: Record<string, VariantTableColumnKey[]> = {
    product_master_id: ['product_master_id'],
    internal_sku: ['internal_sku'],
    barcode: ['barcode'],
    color_code: ['color_code'],
    color_description: ['color_description'],
    size_lens: ['size_lens'],
    size_bridge: ['size_bridge'],
    size_temple: ['size_temple'],
    size_std: ['size_std'],
    is_active: ['is_active'],
    has_primary_image: ['thumbnail'],
  };

  private editingVariants = new Set<number>();
  private deletingVariants = new Set<number>();
  private inlineSavingVariants = new Set<number>();
  private bulkDeletingVariants = false;
  private savingVariantForm = false;
  private autoFullEditRequested = false;
  private autoFullEditProductMasterId: number | null = null;

  public variants = signal<OamProductVariant[]>([]);
  public loading = signal<boolean>(false);
  public showForm = signal<boolean>(false);
  public selectedVariantId = signal<number | null>(null);
  public currentFilters = signal<VariantQueryParams>({});
  public selectedIds: number[] = [];
  public sequentialEditIds: number[] = [];
  public sequentialEditIndex = signal<number>(0);
  public sequentialEditActive = signal<boolean>(false);
  // Guarda columnas visibles de la tabla segun filtros activos.
  public visibleVariantColumns = signal<VariantTableColumnKey[]>(this.defaultVariantColumns);

  public variantForm: FormGroup = this.fb.group({
    product_master_id: [null, [Validators.required]],
    internal_sku: ['', [Validators.required]],
    barcode: [''],
    color_code: [''],
    color_description: [''],
    size_lens: [''],
    size_bridge: [''],
    size_temple: [''],
    size_std: [''],
    primary_image_url: [''],
    gallery_urls: [[]],
    is_active: [true],
  });

  public readonly variantEditBaseConfig: CrudConfig<OamProductVariant> = {
    entity: 'product-variant',
    title: 'Editar Variante',
    mode: 'edit',
    sections: [
      {
        key: 'general',
        title: 'Información de Variante',
        columns: 2,
        fields: [
          {
            key: 'product_master_id',
            label: 'Product Master',
            type: 'number',
            required: true,
          },
          {
            key: 'internal_sku',
            label: 'Internal SKU',
            type: 'text',
            required: true,
          },
          {
            key: 'barcode',
            label: 'Barcode',
            type: 'text',
          },
          {
            key: 'color_code',
            label: 'Color Code',
            type: 'text',
          },
          {
            key: 'color_description',
            label: 'Color Description',
            type: 'text',
          },
          {
            key: 'size_lens',
            label: 'Size Lens',
            type: 'text',
          },
          {
            key: 'size_bridge',
            label: 'Size Bridge',
            type: 'text',
          },
          {
            key: 'size_temple',
            label: 'Size Temple',
            type: 'text',
          },
          {
            key: 'size_std',
            label: 'Size Std',
            type: 'text',
            colSpan: 2,
          },
          {
            key: 'primary_image_url',
            label: 'Imagen principal',
            type: 'image',
            colSpan: 2,
            hint: 'Imagen principal de la variante',
          },
          {
            key: 'gallery_urls',
            label: 'Galería',
            type: 'gallery',
            colSpan: 2,
            hint: 'Carga múltiples imágenes o videos de la variante',
          },
          {
            key: 'is_active',
            label: 'Activa',
            type: 'checkbox',
            hint: 'Variante activa',
            colSpan: 2,
          },
        ],
      },
    ],
    actions: {
      submitLabel: 'Actualizar Variante',
      cancelLabel: 'Cancelar',
    },
  };

  public variantEditConfig: CrudConfig<OamProductVariant> = this.variantEditBaseConfig;

  private applyVariantEditConfig(): void {
    // Activa restricciones extra cuando hay 2 o mas variantes seleccionadas.
    const isLargeSelection = this.hasRestrictedBulkSelection();
    const isBulkEdit = this.sequentialEditActive();

    this.variantEditConfig = {
      ...this.variantEditBaseConfig,
      sections: this.variantEditBaseConfig.sections?.map((section) => ({
        ...section,
        fields: section.fields.map((field) => {
          const isBaseReadonlyField =
            isBulkEdit && (field.key === 'product_master_id' || field.key === 'internal_sku');

          // En seleccion grande se bloquea barcode y se ocultan imagen principal/galeria.
          const isBarcodeReadonly = isLargeSelection && field.key === 'barcode';
          const isMediaHidden =
            isLargeSelection && (field.key === 'primary_image_url' || field.key === 'gallery_urls');

          return {
            ...field,
            readonly: isBaseReadonlyField || isBarcodeReadonly,
            hidden: isMediaHidden,
          };
        }),
      })),
    };
  }

  ngOnInit(): void {
    this.applyInitialRouteFilters();
    this.applyVariantEditConfig();
    this.initVariantsRequests();
    this.loadVariants();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isVariantBusy(variantId: number): boolean {
    return (
      this.editingVariants.has(variantId) ||
      this.deletingVariants.has(variantId) ||
      this.inlineSavingVariants.has(variantId) ||
      (this.savingVariantForm && this.selectedVariantId() === variantId)
    );
  }

  isPageBusy(): boolean {
    return this.loading() || this.savingVariantForm || this.bulkDeletingVariants;
  }

  private initVariantsRequests(): void {
    this.variantsRequest$
      .pipe(
        debounceTime(150),
        tap(() => {
          this.loading.set(true);
        }),
        switchMap((filters) =>
          this.variantService.getVariants(filters).pipe(
            tap((response) => {
              this.variants.set(response?.data || []);
              this.loading.set(false);
              this.handleAutoFullEditAfterLoad();
            }),
            catchError((error) => {
              console.error('Error al cargar variantes:', error);
              this.loading.set(false);
              return EMPTY;
            }),
          ),
        ),
        takeUntil(this.destroy$),
      )
      .subscribe();
  }

  loadVariants(): void {
    this.variantsRequest$.next(this.currentFilters());
  }

  onUpdateFilters(filters: VariantQueryParams): void {
    if (this.savingVariantForm) return;
    // Si hay full edit automático pendiente, fuerza el filtro del product master objetivo.
    if (this.autoFullEditRequested && this.autoFullEditProductMasterId) {
      this.currentFilters.set({
        ...filters,
        product_master_id: this.autoFullEditProductMasterId,
      });
    } else {
      this.currentFilters.set(filters);
    }
    this.loadVariants();
  }

  // Sincroniza columnas visibles de la tabla de variantes con filtros activos.
  onActiveVariantFiltersChange(activeFilters: string[]): void {
    const mappedColumns = activeFilters.flatMap(
      (filterId) => this.variantFilterColumnMap[filterId] ?? [],
    );

    const nextColumns = Array.from(new Set([...this.defaultVariantColumns, ...mappedColumns]));
    this.visibleVariantColumns.set(nextColumns);
  }

  onSelectionChange(ids: number[]): void {
    if (this.isPageBusy()) return;
    this.selectedIds = ids;
    this.applyVariantEditConfig();
  }

  clearSelection(): void {
    if (this.isPageBusy()) return;
    this.selectedIds = [];
    this.applyVariantEditConfig();
  }

  editVariant(variant: OamProductVariant): void {
    if (this.isVariantBusy(variant.id) || this.savingVariantForm) {
      return;
    }

    this.applyVariantEditConfig();

    this.editingVariants.add(variant.id);
    this.selectedVariantId.set(variant.id);

    this.variantForm.patchValue({
      product_master_id: variant.product_master_id,
      internal_sku: variant.internal_sku ?? '',
      barcode: variant.barcode ?? '',
      color_code: variant.color_code ?? '',
      color_description: variant.color_description ?? '',
      size_lens: variant.size_lens ?? '',
      size_bridge: variant.size_bridge ?? '',
      size_temple: variant.size_temple ?? '',
      size_std: variant.size_std ?? '',
      primary_image_url: variant.primary_image_url ?? '',
      gallery_urls: variant.gallery_urls ?? [],
      is_active: variant.is_active,
    });

    this.showForm.set(true);

    setTimeout(() => {
      this.editingVariants.delete(variant.id);
    }, 0);
  }

  editSelected(): void {
    if (this.selectedIds.length === 0 || this.isPageBusy()) {
      return;
    }

    if (this.selectedIds.length === 1) {
      const variant = this.variants().find((item) => item.id === this.selectedIds[0]);
      if (variant) {
        this.editVariant(variant);
      }
      return;
    }

    this.sequentialEditIds = [...this.selectedIds];
    this.sequentialEditIndex.set(0);
    this.sequentialEditActive.set(true);
    this.applyVariantEditConfig();
    this.openSequentialVariantByIndex();
  }

  private openSequentialVariantByIndex(): void {
    const currentId = this.sequentialEditIds[this.sequentialEditIndex()];

    if (!currentId) {
      this.finishSequentialEdit();
      return;
    }

    const variant = this.variants().find((item) => item.id === currentId);

    if (!variant) {
      this.goToNextSequentialVariant();
      return;
    }

    this.editVariant(variant);
  }

  goToNextSequentialVariant(): void {
    const nextIndex = this.sequentialEditIndex() + 1;

    if (nextIndex >= this.sequentialEditIds.length) {
      this.finishSequentialEdit();
      return;
    }

    this.sequentialEditIndex.set(nextIndex);
    this.openSequentialVariantByIndex();
  }

  private finishSequentialEdit(): void {
    this.sequentialEditIds = [];
    this.sequentialEditIndex.set(0);
    this.sequentialEditActive.set(false);
    this.applyVariantEditConfig();
    this.clearSelection();
    this.closeForm();
  }

  closeForm(): void {
    if (this.savingVariantForm) {
      return;
    }

    this.showForm.set(false);
    this.selectedVariantId.set(null);

    this.variantForm.reset({
      product_master_id: null,
      internal_sku: '',
      barcode: '',
      color_code: '',
      color_description: '',
      size_lens: '',
      size_bridge: '',
      size_temple: '',
      size_std: '',
      primary_image_url: '',
      gallery_urls: [],
      is_active: true,
    });
  }

  async onSaveVariant(): Promise<void> {
    if (this.savingVariantForm) {
      return;
    }

    if (this.variantForm.invalid || !this.selectedVariantId()) {
      this.variantForm.markAllAsTouched();
      return;
    }

    const variantId = this.selectedVariantId()!;

    if (this.deletingVariants.has(variantId)) {
      return;
    }

    this.savingVariantForm = true;

    try {
      const rawValue = this.variantForm.getRawValue();
      const mediaPayload = await this.resolveMediaPayload(rawValue);

      const payload: Partial<OamProductVariant> = {
        ...rawValue,
        primary_image_url: mediaPayload.primary_image_url,
        gallery_urls: mediaPayload.gallery_urls,
      };

      await firstValueFrom(this.variantService.updateVariant(variantId, payload));

      this.loadVariants();

      if (this.sequentialEditActive()) {
        this.savingVariantForm = false;
        this.goToNextSequentialVariant();
        return;
      }

      this.savingVariantForm = false;
      this.closeForm();
    } catch (error) {
      this.savingVariantForm = false;
      console.error('Error al actualizar variante:', error);
    }
  }

  deleteVariant(variantId: number): void {
    if (this.deletingVariants.has(variantId) || this.savingVariantForm) {
      return;
    }

    const confirmed = confirm('¿Seguro que deseas eliminar esta variante?');
    if (!confirmed) return;

    this.deletingVariants.add(variantId);

    this.variantService.deleteVariant(variantId).subscribe({
      next: () => {
        this.deletingVariants.delete(variantId);

        if (this.selectedVariantId() === variantId) {
          this.closeForm();
        }

        this.variants.update((current) => current.filter((item) => item.id !== variantId));
        this.selectedIds = this.selectedIds.filter((id) => id !== variantId);
      },
      error: (error) => {
        this.deletingVariants.delete(variantId);
        console.error('Error al eliminar variante:', error);
      },
    });
  }

  deleteSelected(): void {
    if (this.bulkDeletingVariants || this.selectedIds.length === 0) {
      return;
    }

    const confirmed = confirm(
      `¿Seguro que deseas eliminar ${this.selectedIds.length} variantes seleccionadas?`,
    );
    if (!confirmed) return;

    this.bulkDeletingVariants = true;
    const idsToDelete = [...this.selectedIds];
    let processed = 0;

    idsToDelete.forEach((id) => {
      if (this.deletingVariants.has(id)) {
        processed++;
        if (processed === idsToDelete.length) {
          this.bulkDeletingVariants = false;
          this.selectedIds = [];
        }
        return;
      }

      this.deletingVariants.add(id);

      this.variantService.deleteVariant(id).subscribe({
        next: () => {
          this.deletingVariants.delete(id);
          this.variants.update((current) => current.filter((item) => item.id !== id));
          processed++;

          if (processed === idsToDelete.length) {
            this.bulkDeletingVariants = false;
            this.selectedIds = [];
          }
        },
        error: (error) => {
          this.deletingVariants.delete(id);
          processed++;
          console.error(`Error al eliminar variante ${id}:`, error);

          if (processed === idsToDelete.length) {
            this.bulkDeletingVariants = false;
            this.selectedIds = [];
          }
        },
      });
    });
  }

  onInlineSaveVariant(event: VariantInlineEditEvent): void {
    if (this.sequentialEditActive()) {
      return;
    }

    // Bloquea guardado inline de barcode cuando hay seleccion masiva (2+).
    if (event.field === 'barcode' && this.hasRestrictedBulkSelection()) {
      return;
    }

    if (this.inlineSavingVariants.has(event.id) || this.deletingVariants.has(event.id)) {
      return;
    }

    const current = this.variants().find((item) => item.id === event.id);
    if (!current) {
      return;
    }

    const nextValue = String(event.value ?? '').trim();

    const payload: Partial<OamProductVariant> = {
      product_master_id: current.product_master_id,
      internal_sku: event.field === 'internal_sku' ? nextValue : (current.internal_sku ?? ''),
      barcode: event.field === 'barcode' ? nextValue : (current.barcode ?? ''),
      color_code: current.color_code ?? '',
      color_description:
        event.field === 'color_description' ? nextValue : (current.color_description ?? ''),
      size_lens: current.size_lens ?? '',
      size_bridge: current.size_bridge ?? '',
      size_temple: current.size_temple ?? '',
      size_std: event.field === 'size_std' ? nextValue : (current.size_std ?? ''),
      primary_image_url: current.primary_image_url ?? '',
      gallery_urls: current.gallery_urls ?? [],
      is_active: event.field === 'is_active' ? nextValue === '1' : Boolean(current.is_active),
    };

    this.inlineSavingVariants.add(event.id);

    this.variantService.updateVariant(event.id, payload).subscribe({
      next: () => {
        this.inlineSavingVariants.delete(event.id);

        this.variants.update((items) =>
          items.map((item) =>
            item.id === event.id
              ? {
                  ...item,
                  ...(event.field === 'internal_sku' ? { internal_sku: nextValue } : {}),
                  ...(event.field === 'barcode' ? { barcode: nextValue } : {}),
                  ...(event.field === 'color_description' ? { color_description: nextValue } : {}),
                  ...(event.field === 'size_std' ? { size_std: nextValue } : {}),
                  ...(event.field === 'is_active' ? { is_active: nextValue === '1' } : {}),
                }
              : item,
          ),
        );
      },
      error: (error) => {
        this.inlineSavingVariants.delete(event.id);
        console.error(`Error actualizando variante ${event.id}:`, error);
      },
    });
  }

  cancelSequentialEdit(): void {
    this.finishSequentialEdit();
  }

  // Determina si la seleccion actual debe bloquear barcode y media (2 o mas).
  hasRestrictedBulkSelection(): boolean {
    return (
      this.selectedIds.length >= 2 ||
      (this.sequentialEditActive() && this.sequentialEditIds.length >= 2)
    );
  }

  private isDataUrl(value: unknown): value is string {
    return typeof value === 'string' && value.startsWith('data:');
  }

  private async dataUrlToFile(dataUrl: string, fileName: string): Promise<File> {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const extension = this.getExtensionFromMime(blob.type);

    return new File([blob], `${fileName}.${extension}`, {
      type: blob.type || 'application/octet-stream',
    });
  }

  private getExtensionFromMime(mime: string): string {
    switch (mime) {
      case 'image/jpeg':
        return 'jpg';
      case 'image/png':
        return 'png';
      case 'image/webp':
        return 'webp';
      case 'image/tiff':
        return 'tiff';
      case 'video/mp4':
        return 'mp4';
      case 'video/webm':
        return 'webm';
      case 'video/ogg':
        return 'ogg';
      case 'video/quicktime':
        return 'mov';
      default:
        return 'bin';
    }
  }

  private async resolveMediaPayload(rawValue: any): Promise<{
    primary_image_url: string;
    gallery_urls: string[];
  }> {
    const currentPrimary =
      typeof rawValue.primary_image_url === 'string' ? rawValue.primary_image_url : '';

    const currentGallery: string[] = Array.isArray(rawValue.gallery_urls)
      ? rawValue.gallery_urls.filter((item: unknown): item is string => typeof item === 'string')
      : [];

    const persistedGalleryUrls = currentGallery.filter((item) => !this.isDataUrl(item));

    const filesToUpload: File[] = [];

    if (this.isDataUrl(currentPrimary)) {
      filesToUpload.push(
        await this.dataUrlToFile(currentPrimary, `${rawValue.internal_sku || 'variant'}-primary`),
      );
    }

    const galleryDataUrls = currentGallery.filter((item) => this.isDataUrl(item));

    for (let index = 0; index < galleryDataUrls.length; index++) {
      filesToUpload.push(
        await this.dataUrlToFile(
          galleryDataUrls[index],
          `${rawValue.internal_sku || 'variant'}-gallery-${index + 1}`,
        ),
      );
    }

    if (!filesToUpload.length) {
      return {
        primary_image_url: !this.isDataUrl(currentPrimary) ? currentPrimary : '',
        gallery_urls: persistedGalleryUrls,
      };
    }

    const response = await firstValueFrom(
      this.variantService.uploadVariantMedia(
        Number(rawValue.product_master_id),
        String(rawValue.internal_sku || ''),
        filesToUpload,
      ),
    );

    return {
      primary_image_url: this.isDataUrl(currentPrimary)
        ? (response.primary_image_url ?? '')
        : currentPrimary,
      gallery_urls: [...persistedGalleryUrls, ...(response.gallery_urls ?? [])],
    };
  }

  // Lee query params iniciales para abrir /variants en modo full edit por product master.
  private applyInitialRouteFilters(): void {
    const productMasterIdParam = this.route.snapshot.queryParamMap.get('product_master_id');
    const autoFullEditParam = this.route.snapshot.queryParamMap.get('auto_full_edit');
    const parsedProductMasterId = Number(productMasterIdParam);

    if (!productMasterIdParam || Number.isNaN(parsedProductMasterId) || parsedProductMasterId <= 0) {
      return;
    }

    this.currentFilters.set({
      ...this.currentFilters(),
      product_master_id: parsedProductMasterId,
    });

    if (autoFullEditParam === '1') {
      this.autoFullEditRequested = true;
      this.autoFullEditProductMasterId = parsedProductMasterId;
    }
  }

  // Selecciona variantes del product master filtrado y abre edicion multiple automaticamente.
  private handleAutoFullEditAfterLoad(): void {
    if (!this.autoFullEditRequested || !this.autoFullEditProductMasterId) {
      return;
    }

    const targetVariantIds = this.variants()
      .filter((variant) => Number(variant.product_master_id) === this.autoFullEditProductMasterId)
      .map((variant) => variant.id);

    if (targetVariantIds.length <= 1) {
      this.autoFullEditRequested = false;
      return;
    }

    this.selectedIds = targetVariantIds;
    this.editSelected();
    this.autoFullEditRequested = false;
  }
}
