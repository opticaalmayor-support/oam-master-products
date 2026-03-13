import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { OamProductMaster } from '../../../../../core/models/product.model';
import { EditableCellComponent } from '../editable-cell/editable-cell.component';

type InlineEditEvent = {
  id: number;
  field: 'oam_key' | 'template_name' | 'status';
  value: string;
};

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
}
