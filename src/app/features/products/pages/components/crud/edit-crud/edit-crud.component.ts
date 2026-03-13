import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CrudConfig, CrudFieldConfig } from '../crud.types';

@Component({
  selector: 'app-edit-crud',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-crud.component.html',
})
export class EditCrudComponent {
  @Input({ required: true }) form!: FormGroup;
  @Input({ required: true }) config!: CrudConfig<any>;

  @Output() closed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<void>();
  @Output() fieldAction = new EventEmitter<string>();

  get fields(): CrudFieldConfig[] {
    if (this.config.sections?.length) {
      return [];
    }

    return this.config.fields ?? [];
  }

  onClose(): void {
    this.closed.emit();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitted.emit();
  }

  onFieldAction(fieldKey: string): void {
    this.fieldAction.emit(fieldKey);
  }

  trackByKey(_: number, field: CrudFieldConfig): string {
    return String(field.key);
  }
}
