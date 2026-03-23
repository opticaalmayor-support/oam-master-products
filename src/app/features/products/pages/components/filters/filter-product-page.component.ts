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

type PersistedFiltersState = {
  activeFilters: string[];
  filterValues: Record<string, any>;
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
  // Notifica al padre que filtros estan activos para sincronizar columnas visibles.
  @Output() activeFiltersChanged = new EventEmitter<string[]>();

  filterValues: Record<string, any> = {};
  activeFilters = signal<string[]>([]);
  openDropdown = signal<string | null>(null);

  private initialized = false;
  // Prefijo usado para separar el estado persistido de filtros por pantalla.
  private readonly storagePrefix = 'oam_filters_products_';

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
        { id: 'collection_id', label: 'Colección', type: 'select' },
        { id: 'brand_id', label: 'Marca', type: 'select' },
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
    // Intenta restaurar filtros guardados para el modo actual.
    const restored = this.hydrateStateFromStorage();

    // Si no hay estado previo, aplica el filtro inicial por defecto.
    if (!restored) {
      this.activeFilters.set(this.getInitialActiveFilters(this.mode));
    }

    this.initialized = true;

    // Publica filtros activos iniciales (restaurados o por defecto).
    this.emitActiveFilters();

    // Reaplica filtros restaurados para refrescar listado despues de recargar página.
    if (restored) {
      this.filtersChanged.emit({ ...this.filterValues });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.initialized) {
      return;
    }

    if (changes['mode'] && !changes['mode'].firstChange) {
      const previousMode = changes['mode'].previousValue as FilterMode | undefined;
      const currentMode = changes['mode'].currentValue as FilterMode;

      if (previousMode !== currentMode) {
        // Cambia de modo cargando su propio estado persistido (master/variant).
        const restored = this.hydrateStateFromStorage();

        if (!restored) {
          this.resetState(false);
        }

        // Reemite los filtros del nuevo modo para mantener la lista sincronizada.
        this.filtersChanged.emit({ ...this.filterValues });
        // Publica filtros activos del modo actual para recalcular columnas visibles.
        this.emitActiveFilters();
        this.openDropdown.set(null);
      }
    }
  }

  get filterGroups(): FilterGroup[] {
    return this.mode === 'variant' ? this.variantFilterGroups : this.masterFilterGroups;
  }

  private getInitialActiveFilters(mode: FilterMode): string[] {
    return mode === 'variant' ? ['internal_sku'] : ['upc', 'collection_id', 'brand_id'];
  }

  toggleDropdown(groupName: string): void {
    const current = this.openDropdown();
    this.openDropdown.set(current === groupName ? null : groupName);
  }

  isDropdownOpen(groupName: string): boolean {
    return this.openDropdown() === groupName;
  }

  toggleFilter(fieldId: string): void {
    const current = this.activeFilters();
    const next = current.includes(fieldId)
      ? current.filter((id) => id !== fieldId)
      : [...current, fieldId];

    if (current.includes(fieldId)) {
      delete this.filterValues[fieldId];
    }

    this.activeFilters.set(this.getOrderedActiveFilters(next));

    // Persiste cambios de filtros activos para conservarlos al refrescar.
    this.persistStateToStorage();
    // Publica el nuevo estado de filtros activos tras marcar/desmarcar.
    this.emitActiveFilters();
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
      this.persistStateToStorage();
      return;
    }

    if (type === 'number') {
      value = Number(value);
    }

    if (type === 'bool') {
      value = value === '1';
    }

    this.filterValues[fieldId] = value;
    // Persiste el valor del filtro al cambiar para mantener el contexto del usuario.
    this.persistStateToStorage();
  }

  applyFilters(): void {
    // Asegura persistencia antes de enviar filtros al componente padre.
    this.persistStateToStorage();
    this.filtersChanged.emit({ ...this.filterValues });
  }

  clearFilters(): void {
    this.resetState(true);
    this.openDropdown.set(null);
  }

  clearValues(): void {
    this.filterValues = {};
    this.persistStateToStorage();
    this.filtersChanged.emit({});
  }

  private resetState(emit = false): void {
    this.filterValues = {};
    this.activeFilters.set(this.getInitialActiveFilters(this.mode));
    this.persistStateToStorage();

    if (emit) {
      this.filtersChanged.emit({});
    }

    // Publica filtros activos tras limpiar o reiniciar estado.
    this.emitActiveFilters();
  }

  // Emite una copia de filtros activos para evitar mutaciones externas.
  private emitActiveFilters(): void {
    this.activeFiltersChanged.emit([...this.activeFilters()]);
  }

  // Construye la llave de localStorage separada por modo (master/variant).
  private getStorageKey(): string {
    return `${this.storagePrefix}${this.mode}`;
  }

  // Obtiene los ids válidos de filtros para sanear datos recuperados de localStorage.
  private getAvailableFilterIds(): string[] {
    return this.filterGroups.flatMap((group) => group.items.map((item) => item.id));
  }

  // Carga y aplica filtros persistidos si existen y son válidos.
  private hydrateStateFromStorage(): boolean {
    try {
      const raw = localStorage.getItem(this.getStorageKey());

      if (!raw) {
        return false;
      }

      const parsed = JSON.parse(raw) as PersistedFiltersState;

      const availableIds = new Set(this.getAvailableFilterIds());

      const persistedValues =
        parsed && typeof parsed.filterValues === 'object' && parsed.filterValues !== null
          ? parsed.filterValues
          : {};

      const sanitizedValues = Object.entries(persistedValues).reduce<Record<string, any>>(
        (acc, [key, value]) => {
          if (availableIds.has(key) && value !== '' && value !== null && value !== undefined) {
            acc[key] = value;
          }

          return acc;
        },
        {},
      );

      const persistedActive = Array.isArray(parsed?.activeFilters) ? parsed.activeFilters : [];

      const sanitizedActive = persistedActive.filter((id) => availableIds.has(id));

      // Incluye en activos todo filtro que tenga valor guardado para mostrar su campo.
      const requiredDefaults = this.mode === 'master' ? ['upc', 'collection_id', 'brand_id'] : [];

      const activeWithValues = Array.from(
        new Set([...requiredDefaults, ...sanitizedActive, ...Object.keys(sanitizedValues)]),
      );

      this.filterValues = sanitizedValues;
      this.activeFilters.set(
        this.getOrderedActiveFilters(
          activeWithValues.length ? activeWithValues : this.getInitialActiveFilters(this.mode),
        ),
      );

      return Object.keys(sanitizedValues).length > 0 || activeWithValues.length > 0;
    } catch {
      // Si el JSON guardado está corrupto, se borra para evitar errores futuros.
      localStorage.removeItem(this.getStorageKey());
      return false;
    }
  }

  // Guarda en localStorage filtros activos y valores para restaurarlos tras refresh.
  private persistStateToStorage(): void {
    const payload: PersistedFiltersState = {
      activeFilters: this.activeFilters(),
      filterValues: { ...this.filterValues },
    };

    localStorage.setItem(this.getStorageKey(), JSON.stringify(payload));
  }

  private getOrderedActiveFilters(filters: string[]): string[] {
    if (this.mode === 'variant') {
      return filters;
    }

    const priority: Record<string, number> = {
      upc: 1,
      oam_key: 2,
      template_name: 3,
      collection_id: 4,
      brand_id: 5,
    };

    return [...filters].sort((a, b) => {
      const aPriority = priority[a] ?? 999;
      const bPriority = priority[b] ?? 999;

      if (aPriority === bPriority) {
        return a.localeCompare(b);
      }

      return aPriority - bPriority;
    });
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
          { value: 'men', label: 'Men' },
          { value: 'women', label: 'Women' },
          { value: 'unisex', label: 'Unisex' },
          { value: 'kids', label: 'Kids' },
        ];

      case 'status':
        return [
          { value: 'active', label: 'Active' },
          { value: 'draft', label: 'Draft' },
          { value: 'blocked', label: 'Blocked' },
          { value: 'discontinued', label: 'Discontinued' },
        ];

      default:
        return [];
    }
  }
}
