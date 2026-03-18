import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CrudConfig, CrudFieldConfig } from '../crud.types';

@Component({
  selector: 'app-create-crud',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-crud.component.html',
})
export class CreateCrudComponent {
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

  onImageSelected(event: Event, fieldKey: string): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      this.form.get(fieldKey)?.setValue(reader.result as string);
      this.form.get(fieldKey)?.markAsDirty();
      this.form.get(fieldKey)?.updateValueAndValidity();
    };

    reader.readAsDataURL(file);
  }

  onGallerySelected(event: Event, fieldKey: string): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (!files || !files.length) return;

    const currentValue = this.form.get(fieldKey)?.value;
    const current: string[] = Array.isArray(currentValue) ? currentValue : [];

    const readers = Array.from(files).map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();

          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error(`No se pudo leer ${file.name}`));

          reader.readAsDataURL(file);
        }),
    );

    Promise.all(readers)
      .then((results) => {
        this.form.get(fieldKey)?.setValue([...current, ...results]);
        this.form.get(fieldKey)?.markAsDirty();
        this.form.get(fieldKey)?.updateValueAndValidity();
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        input.value = '';
      });
  }

  removeGalleryItem(fieldKey: string, item: string): void {
    const currentValue = this.form.get(fieldKey)?.value;
    const current: string[] = Array.isArray(currentValue) ? currentValue : [];

    this.form.get(fieldKey)?.setValue(current.filter((url) => url !== item));
    this.form.get(fieldKey)?.markAsDirty();
    this.form.get(fieldKey)?.updateValueAndValidity();
  }

  isVideo(url: string): boolean {
    if (!url) return false;

    if (url.startsWith('data:video/')) return true;

    return /\.(mp4|webm|ogg|mov)$/i.test(url);
  }
}
