import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { CrudConfig } from '../crud/crud.types';
import { CreateCrudComponent } from '../crud/create-crud/create-crud.component';
import { EditCrudComponent } from '../crud/edit-crud/edit-crud.component';
import { SidebarComponent } from '../Sidebar/sidebar.component';
import { BrandModalComponent } from '../modals/brand-modal/brand-modal.component';
import { CollectionModalComponent } from '../modals/collection-modal/collection-modal.component';

type CatalogMode = 'create' | 'edit' | 'show';

@Component({
  selector: 'app-product-master-workspace',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CreateCrudComponent,
    EditCrudComponent,
    SidebarComponent,
    BrandModalComponent,
    CollectionModalComponent,
  ],
  templateUrl: './product-master-workspace.component.html',
})
export class ProductMasterWorkspaceComponent {
  @Input({ required: true }) showForm = false;
  @Input({ required: true }) isEditMode = false;
  @Input({ required: true }) productForm!: FormGroup;
  @Input({ required: true }) variantForm!: FormGroup;
  @Input({ required: true }) createConfig!: CrudConfig<any>;
  @Input({ required: true }) editConfig!: CrudConfig<any>;
  @Input() brands: any[] = [];
  @Input() collections: any[] = [];
  @Input() selectedProductId: number | null = null;
  @Input() productVariants: any[] = [];
  @Input() selectedVariantId: number | null = null;

  @Input() selectedBrand: any | null = null;
  @Input() selectedCollection: any | null = null;
  @Input() brandMode: CatalogMode = 'create';
  @Input() collectionMode: CatalogMode = 'create';

  @Output() closed = new EventEmitter<void>();
  @Output() saveProduct = new EventEmitter<void>();
  @Output() saveVariant = new EventEmitter<void>();
  @Output() editVariant = new EventEmitter<any>();
  @Output() deleteVariant = new EventEmitter<number>();
  @Output() createVariant = new EventEmitter<void>();

  @Output() brandSubmitted = new EventEmitter<any>();
  @Output() collectionSubmitted = new EventEmitter<any>();

  @Output() createBrand = new EventEmitter<void>();
  @Output() editBrand = new EventEmitter<any>();
  @Output() showBrand = new EventEmitter<any>();
  @Output() deleteBrand = new EventEmitter<any>();

  @Output() createCollection = new EventEmitter<void>();
  @Output() editCollection = new EventEmitter<any>();
  @Output() showCollection = new EventEmitter<any>();
  @Output() deleteCollection = new EventEmitter<any>();

  leftPanelOpen = signal(false);

  openFieldPanel(fieldKey: string): void {
    if (fieldKey === 'brand_id' || fieldKey === 'collection_id') {
      this.leftPanelOpen.set(true);
    }
  }

  closeLeftPanel(): void {
    this.leftPanelOpen.set(false);
  }

  onBrandSubmitted(payload: any): void {
    this.brandSubmitted.emit(payload);

    if (this.brandMode !== 'show') {
      this.closeLeftPanel();
    }
  }

  onCollectionSubmitted(payload: any): void {
    this.collectionSubmitted.emit(payload);

    if (this.collectionMode !== 'show') {
      this.closeLeftPanel();
    }
  }

  onBrandNameClick(brand: any): void {
    this.editBrand.emit(brand);
  }

  onCollectionNameClick(collection: any): void {
    this.editCollection.emit(collection);
  }

  get visibleCollections(): any[] {
    const brandId = this.productForm.get('brand_id')?.value ?? null;

    if (!brandId) {
      return [];
    }

    return this.collections
      .filter((collection) => collection.brand_id === brandId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  get brandSectionTitle(): string {
    if (this.brandMode === 'edit') return 'Editar Marca';
    if (this.brandMode === 'show') return 'Detalle de Marca';
    return 'Marca';
  }

  get collectionSectionTitle(): string {
    if (this.collectionMode === 'edit') return 'Editar Colección';
    if (this.collectionMode === 'show') return 'Detalle de Colección';
    return 'Colección';
  }

  get isEditingVariant(): boolean {
    return !!this.selectedVariantId;
  }
}
