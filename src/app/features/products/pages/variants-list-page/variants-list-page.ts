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

@Component({
  selector: 'app-variants-list-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FilterProductPageComponent,
    EditCrudComponent,
    SidebarComponent,
  ],
  templateUrl: './variants-list-page.html',
  styleUrl: './variants-list-page.scss',
})
export class VariantsListPage implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private variantService = inject(OamProductVariantService);

  private destroy$ = new Subject<void>();
  private variantsRequest$ = new Subject<VariantQueryParams>();

  public variants = signal<OamProductVariant[]>([]);
  public loading = signal<boolean>(false);
  public showForm = signal<boolean>(false);
  public selectedVariantId = signal<number | null>(null);
  public currentFilters = signal<VariantQueryParams>({});

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
            label: 'Product Master ID',
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
    this.currentFilters.set(filters);
    this.loadVariants();
  }

  editVariant(variant: OamProductVariant): void {
    this.selectedVariantId.set(variant.id);

    this.variantForm.patchValue({
      product_master_id: variant.product_master_id,
      internal_sku: variant.internal_sku,
      barcode: variant.barcode || '',
      color_code: variant.color_code || '',
      color_description: variant.color_description || '',
      size_lens: variant.size_lens || '',
      size_bridge: variant.size_bridge || '',
      size_temple: variant.size_temple || '',
      size_std: variant.size_std || '',
      primary_image_url: variant.primary_image_url || '',
      is_active: variant.is_active,
    });

    this.showForm.set(true);
  }

  closeForm(): void {
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
    if (this.variantForm.invalid || !this.selectedVariantId()) {
      this.variantForm.markAllAsTouched();
      return;
    }

    const payload = this.variantForm.getRawValue();

    this.variantService.updateVariant(this.selectedVariantId()!, payload).subscribe({
      next: () => {
        this.loadVariants();
        this.closeForm();
      },
      error: (error) => {
        console.error('Error al actualizar variante:', error);
      },
    });
  }

  deleteVariant(variantId: number): void {
    const confirmed = confirm('¿Seguro que deseas eliminar esta variante?');
    if (!confirmed) return;

    this.variantService.deleteVariant(variantId).subscribe({
      next: () => {
        this.loadVariants();
      },
      error: (error) => {
        console.error('Error al eliminar variante:', error);
      },
    });
  }
}
