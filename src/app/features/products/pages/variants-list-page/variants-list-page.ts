import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, EMPTY } from 'rxjs';
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
  private variantService = inject(OamProductVariantService);

  private destroy$ = new Subject<void>();
  private variantsRequest$ = new Subject<VariantQueryParams>();

  private editingVariants = new Set<number>();
  private deletingVariants = new Set<number>();
  private inlineSavingVariants = new Set<number>();
  private bulkDeletingVariants = false;
  private savingVariantForm = false;

  public variants = signal<OamProductVariant[]>([]);
  public loading = signal<boolean>(false);
  public showForm = signal<boolean>(false);
  public selectedVariantId = signal<number | null>(null);
  public currentFilters = signal<VariantQueryParams>({});
  public selectedIds: number[] = [];
  public sequentialEditIds: number[] = [];
  public sequentialEditIndex = signal<number>(0);
  public sequentialEditActive = signal<boolean>(false);

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
    is_active: [true],
  });

  public variantEditConfig: CrudConfig<OamProductVariant> = {
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
            label: 'Primary Image URL',
            type: 'url',
            colSpan: 2,
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

  ngOnInit(): void {
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
    this.currentFilters.set(filters);
    this.loadVariants();
  }

  onSelectionChange(ids: number[]): void {
    if (this.isPageBusy()) return;
    this.selectedIds = ids;
  }

  clearSelection(): void {
    if (this.isPageBusy()) return;
    this.selectedIds = [];
  }

  editVariant(variant: OamProductVariant): void {
    if (this.isVariantBusy(variant.id) || this.savingVariantForm) {
      return;
    }

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
      is_active: true,
    });
  }

  onSaveVariant(): void {
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
    const payload = this.variantForm.getRawValue();

    this.variantService.updateVariant(variantId, payload).subscribe({
      next: () => {
        this.savingVariantForm = false;
        this.loadVariants();

        if (this.sequentialEditActive()) {
          this.goToNextSequentialVariant();
          return;
        }

        this.closeForm();
      },
      error: (error) => {
        this.savingVariantForm = false;
        console.error('Error al actualizar variante:', error);
      },
    });
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
                  internal_sku: event.field === 'internal_sku' ? nextValue : item.internal_sku,
                  barcode: event.field === 'barcode' ? nextValue : item.barcode,
                  color_description:
                    event.field === 'color_description' ? nextValue : item.color_description,
                  size_std: event.field === 'size_std' ? nextValue : item.size_std,
                  is_active: event.field === 'is_active' ? nextValue === '1' : item.is_active,
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
}
