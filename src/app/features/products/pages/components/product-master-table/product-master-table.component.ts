import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { OamProductMaster } from '../../../../../core/models/product.model';
import { EditableCellComponent } from '../editable-cell/editable-cell.component';

type InlineEditEvent = {
  id: number;
  field: 'oam_key' | 'template_name' | 'status';
  value: string;
};

type ProductMasterTableColumnKey =
  | 'id'
  | 'oam_key'
  | 'template_name'
  | 'status'
  | 'upc'
  | 'product_family'
  | 'gender'
  | 'brand'
  | 'collection'
  | 'made_in'
  | 'description_short'
  | 'created_by'
  | 'approved_by'
  | 'approved_at'
  | 'primary_image'
  | 'gallery_count'
  | 'variants_count';

@Component({
  selector: 'app-product-master-table',
  standalone: true,
  imports: [CommonModule, EditableCellComponent],
  templateUrl: './product-master-table.component.html',
})
export class ProductMasterTableComponent {
  @Input() items: OamProductMaster[] = [];
  @Input() selectedIds: number[] = [];
  @Input() inlineEditDisabled = false;
  @Input() visibleColumns: ProductMasterTableColumnKey[] = [
    'id',
    'oam_key',
    'template_name',
    'status',
  ];

  @Output() selectionChange = new EventEmitter<number[]>();
  @Output() editRow = new EventEmitter<OamProductMaster>();
  @Output() deleteRow = new EventEmitter<number>();
  @Output() inlineSave = new EventEmitter<InlineEditEvent>();

  readonly statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Draft', value: 'draft' },
    { label: 'Blocked', value: 'blocked' },
    { label: 'Discontinued', value: 'discontinued' },
  ];

  toggleSelection(id: number): void {
    const exists = this.selectedIds.includes(id);

    const nextSelection = exists
      ? this.selectedIds.filter((x) => x !== id)
      : [...this.selectedIds, id];

    this.selectionChange.emit(nextSelection);
  }

  toggleAll(checked: boolean): void {
    if (!checked) {
      this.selectionChange.emit([]);
      return;
    }

    this.selectionChange.emit(this.items.map((item) => item.id));
  }

  isSelected(id: number): boolean {
    return this.selectedIds.includes(id);
  }

  areAllSelected(): boolean {
    return this.items.length > 0 && this.items.every((item) => this.selectedIds.includes(item.id));
  }

  emitInlineSave(id: number, field: 'oam_key' | 'template_name' | 'status', value: string): void {
    this.inlineSave.emit({ id, field, value });
  }

  // Verifica si una columna debe mostrarse segun filtros activos.
  showColumn(column: ProductMasterTableColumnKey): boolean {
    return this.visibleColumns.includes(column);
  }

  // Entrega el total de columnas renderizadas para el estado vacio.
  get emptyStateColspan(): number {
    return this.visibleColumns.length + 1;
  }

  // Devuelve nombre de marca legible para celdas de tabla.
  getBrandName(item: OamProductMaster): string {
    return item.oam_brand?.name ?? (item.brand_id ? String(item.brand_id) : '—');
  }

  // Devuelve nombre de coleccion legible para celdas de tabla.
  getCollectionName(item: OamProductMaster): string {
    return item.oam_collection?.name ?? (item.collection_id ? String(item.collection_id) : '—');
  }
}
