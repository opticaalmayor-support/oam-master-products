// Importa decoradores y utilidades de Angular
import { Component, EventEmitter, Output, signal } from '@angular/core';

// Importa CommonModule para usar directivas comunes
import { CommonModule } from '@angular/common';

// Declara el componente standalone de filtros
@Component({
  // Selector del componente
  selector: 'app-filter-product-page',

  // Indica que es standalone
  standalone: true,

  // Módulos importados
  imports: [CommonModule],

  // HTML asociado
  templateUrl: './filter-product-page.component.html',
})
// Clase del componente de filtros
export class FilterProductPageComponent {
  // Emisor que envía los filtros al componente padre
  @Output() filtersChanged = new EventEmitter<any>();

  // Objeto donde se guardan los valores activos de filtros
  filterValues: { [key: string]: any } = {};

  // Signal que controla cuáles filtros están visibles
  activeFilters = signal<string[]>(['upc']);

  // Agrupación visual de filtros
  filterGroups = [
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

  // Activa o desactiva un filtro visible
  toggleFilter(fieldId: string) {
    // Actualiza la lista de filtros activos
    this.activeFilters.update((current) => {
      // Si ya estaba activo
      if (current.includes(fieldId)) {
        // Elimina su valor del objeto
        delete this.filterValues[fieldId];

        // Emite el nuevo estado de filtros
        this.emitFilters();

        // Devuelve la lista sin ese filtro
        return current.filter((id) => id !== fieldId);
      } else {
        // Si no estaba activo, lo agrega a la lista
        return [...current, fieldId];
      }
    });
  }

  // Verifica si un filtro está visible
  isFilterActive(fieldId: string) {
    // Retorna true si el filtro existe en activeFilters
    return this.activeFilters().includes(fieldId);
  }

  // Captura cambios de valor en inputs y selects
  onValueChange(fieldId: string, event: Event) {
    // Convierte el target en input o select
    const target = event.target as HTMLInputElement | HTMLSelectElement;

    // Guarda el valor actual del filtro
    this.filterValues[fieldId] = target.value;

    // Si el valor está vacío, elimina la propiedad
    if (target.value === '') {
      delete this.filterValues[fieldId];
    }

    // Emite los filtros actualizados al padre
    this.emitFilters();
  }

  // Método privado para emitir una copia del objeto de filtros
  private emitFilters() {
    // Emite una copia del objeto para asegurar detección de cambios
    this.filtersChanged.emit({ ...this.filterValues });
  }
}
