import {
  Component,
  EventEmitter,
  Input,
  Output,
  signal,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { OamBrand, OamCollection } from '../../../../../core/models/product.model';

type FilterMode = 'master' | 'variant';

type FilterItem = {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'bool' | 'date';
};

type FilterGroup = {
  name: string;
  items: FilterItem[];
};

@Component({
  selector: 'app-filter-product-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './filter-product-page.component.html',
})
export class FilterProductPageComponent implements OnInit, OnChanges {
  @Input() mode: FilterMode = 'master';
  @Input() brands: OamBrand[] = [];
  @Input() collections: OamCollection[] = [];

  @Output() filtersChanged = new EventEmitter<Record<string, any>>();

  filterValues: Record<string, any> = {};
  activeFilters = signal<string[]>([]);
  openDropdown = signal<string | null>(null);

  private initialized = false;

  private masterFilterGroups: FilterGroup[] = [
    {
      name: 'Búsqueda Directa',
      items: [
        { id: 'upc', label: 'Código UPC / EAN', type: 'text' },
        { id: 'oam_key', label: 'OAM Key (Interno)', type: 'text' },
        { id: 'template_name', label: 'Nombre Plantilla', type: 'text' },
      ],
    },
    {
      name: 'Clasificación',
      items: [
        { id: 'brand_id', label: 'Marca', type: 'select' },
        { id: 'collection_id', label: 'Colección', type: 'select' },
        { id: 'product_family', label: 'Familia de Producto', type: 'select' },
        { id: 'gender', label: 'Género', type: 'select' },
        { id: 'status', label: 'Estado', type: 'select' },
      ],
    },
    {
      name: 'Contenido',
      items: [
        { id: 'made_in', label: 'Origen (Made In)', type: 'text' },
        { id: 'description_short', label: 'Descripción Corta', type: 'text' },
        { id: 'description_long', label: 'Descripción Larga', type: 'text' },
        { id: 'tags', label: 'Tags', type: 'text' },
      ],
    },
    {
      name: 'Gestión',
      items: [
        { id: 'created_by', label: 'Creado por', type: 'number' },
        { id: 'approved_by', label: 'Aprobado por', type: 'number' },
        { id: 'approved_at_from', label: 'Aprobado desde', type: 'date' },
        { id: 'approved_at_to', label: 'Aprobado hasta', type: 'date' },
        { id: 'is_discontinued', label: 'Descontinuado', type: 'bool' },
      ],
    },
    {
      name: 'Medios',
      items: [
        { id: 'has_primary_image', label: 'Tiene Imagen Principal', type: 'bool' },
        { id: 'has_gallery', label: 'Tiene Galería', type: 'bool' },
        { id: 'has_variants', label: 'Tiene Variantes', type: 'bool' },
      ],
    },
  ];

  private variantFilterGroups: FilterGroup[] = [
    {
      name: 'Búsqueda Directa',
      items: [
        { id: 'product_master_id', label: 'Product Master ID', type: 'number' },
        { id: 'internal_sku', label: 'Internal SKU', type: 'text' },
        { id: 'barcode', label: 'Barcode', type: 'text' },
      ],
    },
    {
      name: 'Color',
      items: [
        { id: 'color_code', label: 'Color Code', type: 'text' },
        { id: 'color_description', label: 'Color Description', type: 'text' },
      ],
    },
    {
      name: 'Tamaños',
      items: [
        { id: 'size_lens', label: 'Size Lens', type: 'text' },
        { id: 'size_bridge', label: 'Size Bridge', type: 'text' },
        { id: 'size_temple', label: 'Size Temple', type: 'text' },
        { id: 'size_std', label: 'Size Std', type: 'text' },
      ],
    },
    {
      name: 'Gestión',
      items: [
        { id: 'is_active', label: 'Activo', type: 'bool' },
        { id: 'has_primary_image', label: 'Tiene Imagen Principal', type: 'bool' },
      ],
    },
  ];

  ngOnInit(): void {
    this.activeFilters.set(this.getInitialActiveFilters(this.mode));
    this.initialized = true;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.initialized) {
      return;
    }

    if (changes['mode'] && !changes['mode'].firstChange) {
      const previousMode = changes['mode'].previousValue as FilterMode | undefined;
      const currentMode = changes['mode'].currentValue as FilterMode;

      if (previousMode !== currentMode) {
        this.resetState(false);
        this.openDropdown.set(null);
      }
    }
  }

  get filterGroups(): FilterGroup[] {
    return this.mode === 'variant' ? this.variantFilterGroups : this.masterFilterGroups;
  }

  private getInitialActiveFilters(mode: FilterMode): string[] {
    return mode === 'variant' ? ['internal_sku'] : ['upc'];
  }

  toggleDropdown(groupName: string): void {
    const current = this.openDropdown();
    this.openDropdown.set(current === groupName ? null : groupName);
  }

  isDropdownOpen(groupName: string): boolean {
    return this.openDropdown() === groupName;
  }

  toggleFilter(fieldId: string): void {
    this.activeFilters.update((current) => {
      if (current.includes(fieldId)) {
        delete this.filterValues[fieldId];
        return current.filter((id) => id !== fieldId);
      }

      return [...current, fieldId];
    });
  }

  isFilterActive(fieldId: string): boolean {
    return this.activeFilters().includes(fieldId);
  }

  getFilterValue(fieldId: string): any {
    return this.filterValues[fieldId] ?? '';
  }

  onValueChange(fieldId: string, event: Event, type?: string): void {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    let value: any = target.value;

    if (value === '') {
      delete this.filterValues[fieldId];
      return;
    }

    if (type === 'number') {
      value = Number(value);
    }

    if (type === 'bool') {
      value = value === '1';
    }

    this.filterValues[fieldId] = value;
  }

  applyFilters(): void {
    this.filtersChanged.emit({ ...this.filterValues });
  }

  clearFilters(): void {
    this.resetState(true);
    this.openDropdown.set(null);
  }

  private resetState(emit = false): void {
    this.filterValues = {};
    this.activeFilters.set(this.getInitialActiveFilters(this.mode));

    if (emit) {
      this.filtersChanged.emit({});
    }
  }

  getSelectOptions(fieldId: string): Array<{ value: string | number; label: string }> {
    switch (fieldId) {
      case 'brand_id':
        return this.brands.map((brand) => ({
          value: brand.id,
          label: brand.name,
        }));

      case 'collection_id':
        return this.collections.map((collection) => ({
          value: collection.id,
          label: collection.name,
        }));

      case 'product_family':
        return [
          { value: 'rx', label: 'RX' },
          { value: 'sun', label: 'Sun' },
          { value: 'lens', label: 'Lens' },
          { value: 'accessory', label: 'Accessory' },
          { value: 'other', label: 'Other' },
        ];

      case 'gender':
        return [
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' },
          { value: 'unisex', label: 'Unisex' },
          { value: 'kids', label: 'Kids' },
        ];

      case 'status':
        return [
          { value: 'draft', label: 'Draft' },
          { value: 'pending', label: 'Pending' },
          { value: 'approved', label: 'Approved' },
          { value: 'archived', label: 'Archived' },
        ];

      default:
        return [];
    }
  }
}
