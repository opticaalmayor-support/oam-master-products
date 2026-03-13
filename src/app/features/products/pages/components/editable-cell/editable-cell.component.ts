import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';

type EditableOption = {
  label: string;
  value: string;
};

@Component({
  selector: 'app-editable-cell',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editable-cell.component.html',
})
export class EditableCellComponent {
  @Input() value: string | number | null = null;
  @Input() type: 'text' | 'select' = 'text';
  @Input() placeholder = '';
  @Input() disabled = false;
  @Input() options: EditableOption[] = [];

  @Output() save = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();

  editing = false;
  draftValue = '';

  private committing = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] && !this.editing) {
      this.draftValue = this.toDisplayValue(this.value);
    }
  }

  startEdit(): void {
    if (this.disabled || this.editing) return;

    this.editing = true;
    this.committing = false;
    this.draftValue = this.toDisplayValue(this.value);
  }

  commit(): void {
    if (this.disabled || !this.editing || this.committing) return;

    this.committing = true;

    const normalized = (this.draftValue ?? '').trim();
    const currentValue = this.toDisplayValue(this.value);

    if (normalized === currentValue) {
      this.editing = false;
      this.committing = false;
      return;
    }

    this.save.emit(normalized);
    this.editing = false;

    setTimeout(() => {
      this.committing = false;
    }, 0);
  }

  abort(): void {
    if (!this.editing) return;

    this.editing = false;
    this.committing = false;
    this.draftValue = this.toDisplayValue(this.value);
    this.cancel.emit();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      this.commit();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.abort();
    }
  }

  private toDisplayValue(value: string | number | null): string {
    if (value === null || value === undefined) {
      return '';
    }

    return String(value);
  }
}
