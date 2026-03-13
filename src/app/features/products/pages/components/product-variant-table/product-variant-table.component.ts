import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { EditableCellComponent } from '../editable-cell/editable-cell.component';
import { OamProductVariant } from '../../../../../core/models/product.model';

type InlineEditEvent = {
  id: number;
  field: 'internal_sku' | 'barcode' | 'color_description' | 'size_std' | 'is_active';
  value: string;
};

@Component({
  selector: 'app-product-variant-table',
  standalone: true,
  imports: [CommonModule, EditableCellComponent],
  templateUrl: './product-variant-table.component.html',
})
export class ProductVariantTableComponent {
  @Input() items: OamProductVariant[] = [];
  @Input() selectedIds: number[] = [];
  @Input() inlineEditDisabled = false;

  @Output() selectionChange = new EventEmitter<number[]>();
  @Output() editRow = new EventEmitter<OamProductVariant>();
  @Output() deleteRow = new EventEmitter<number>();
  @Output() inlineSave = new EventEmitter<InlineEditEvent>();

  readonly activeOptions = [
    { label: 'Yes', value: '1' },
    { label: 'No', value: '0' },
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

  emitInlineSave(
    id: number,
    field: 'internal_sku' | 'barcode' | 'color_description' | 'size_std' | 'is_active',
    value: string,
  ): void {
    this.inlineSave.emit({ id, field, value });
  }
}
