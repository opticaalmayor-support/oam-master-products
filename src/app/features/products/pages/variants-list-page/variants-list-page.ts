import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { OamProductVariant, VariantQueryParams } from '../../../../core/models/product.model';

import { FilterProductPageComponent } from '../products-list-page/components/filter-product-page.component';
import { OamProductVariantService } from '../../../../core/services/maestro/OamProductVariant.service';

@Component({
  selector: 'app-variants-list-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FilterProductPageComponent],
  templateUrl: './variants-list-page.html',
  styleUrl: './variants-list-page.scss',
})
export class VariantsListPage implements OnInit {
  private fb = inject(FormBuilder);
  private variantService = inject(OamProductVariantService);

  public variants = signal<OamProductVariant[]>([]);
  public loading = signal<boolean>(false);
  public showForm = signal<boolean>(false);
  public isEditMode = signal<boolean>(false);
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

  ngOnInit(): void {
    this.loadVariants();
  }

  loadVariants(): void {
    this.loading.set(true);

    this.variantService.getVariants(this.currentFilters()).subscribe({
      next: (response) => {
        this.variants.set(response?.data || []);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar variantes:', error);
        this.loading.set(false);
      },
    });
  }

  onUpdateFilters(filters: VariantQueryParams): void {
    this.currentFilters.set(filters);
    this.loadVariants();
  }

  editVariant(variant: OamProductVariant): void {
    this.isEditMode.set(true);
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
    this.isEditMode.set(false);
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
    if (this.variantForm.invalid) {
      this.variantForm.markAllAsTouched();
      return;
    }

    const raw = this.variantForm.getRawValue();

    const payload = {
      ...raw,
      product_master_id: raw.product_master_id ? Number(raw.product_master_id) : null,
      is_active: !!raw.is_active,
    };

    if (this.isEditMode() && this.selectedVariantId()) {
      this.variantService.updateVariant(this.selectedVariantId()!, payload).subscribe({
        next: () => {
          this.closeForm();
          this.loadVariants();
        },
        error: (error) => {
          console.error('Error al actualizar variante:', error);
        },
      });
      return;
    }

    this.variantService.createVariant(payload).subscribe({
      next: () => {
        this.closeForm();
        this.loadVariants();
      },
      error: (error) => {
        console.error('Error al crear variante:', error);
      },
    });
  }

  deleteVariant(id: number): void {
    const confirmed = confirm('¿Estás seguro de que deseas eliminar esta variante?');

    if (!confirmed) {
      return;
    }

    this.variantService.deleteVariant(id).subscribe({
      next: () => {
        this.loadVariants();
      },
      error: (error) => {
        console.error('Error al eliminar variante:', error);
      },
    });
  }
}
