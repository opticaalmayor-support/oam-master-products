import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AbstractControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
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

  getControl(fieldKey: string): AbstractControl | null {
    return this.form.get(fieldKey);
  }

  shouldShowFieldError(fieldKey: string): boolean {
    const control = this.getControl(fieldKey);
    return Boolean(control && control.invalid && (control.touched || control.dirty));
  }

  getFieldErrorMessage(field: CrudFieldConfig): string {
    const fieldKey = field.key.toString();
    const control = this.getControl(fieldKey);

    if (!control?.errors) {
      return '';
    }

    if (control.errors['required']) {
      return `${field.label} es obligatorio.`;
    }

    if (control.errors['requiredTrue']) {
      return `Debes marcar ${field.label.toLowerCase()}.`;
    }

    if (control.errors['email']) {
      return `Ingresa un correo valido en ${field.label.toLowerCase()}.`;
    }

    if (control.errors['maxlength']) {
      return `${field.label} supera el maximo permitido.`;
    }

    if (control.errors['minlength']) {
      return `${field.label} no cumple el minimo de caracteres.`;
    }

    if (control.errors['pattern']) {
      return `${field.label} tiene un formato invalido.`;
    }

    return `Revisa el valor de ${field.label.toLowerCase()}.`;
  }

  onImageSelected(event: Event, fieldKey: string): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    // Convierte imagenes compatibles a webp para optimizar peso antes de guardar preview.
    void this.prepareFileAsDataUrl(file)
      .then((dataUrl) => {
        this.form.get(fieldKey)?.setValue(dataUrl);
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

  onGallerySelected(event: Event, fieldKey: string): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (!files || !files.length) return;

    const currentValue = this.form.get(fieldKey)?.value;
    const current: string[] = Array.isArray(currentValue) ? currentValue : [];

    const readers = Array.from(files).map((file) => this.prepareFileAsDataUrl(file));

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

  // Convierte un archivo a data URL, pasando por webp cuando sea imagen compatible.
  private async prepareFileAsDataUrl(file: File): Promise<string> {
    const normalizedFile = await this.convertImageToWebpIfNeeded(file);
    return this.fileToDataUrl(normalizedFile);
  }

  // Determina si un archivo imagen puede convertirse a webp de forma segura.
  private shouldConvertToWebp(file: File): boolean {
    if (!file.type.startsWith('image/')) {
      return false;
    }

    if (file.type === 'image/webp') {
      return false;
    }

    return ['image/jpeg', 'image/png', 'image/bmp', 'image/tiff'].includes(file.type);
  }

  // Convierte imagenes compatibles a webp con calidad balanceada.
  private async convertImageToWebpIfNeeded(file: File): Promise<File> {
    if (!this.shouldConvertToWebp(file)) {
      return file;
    }

    const imageBitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;

    const context = canvas.getContext('2d');

    if (!context) {
      imageBitmap.close();
      return file;
    }

    context.drawImage(imageBitmap, 0, 0);
    imageBitmap.close();

    const webpBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/webp', 0.8);
    });

    if (!webpBlob) {
      return file;
    }

    const baseName = file.name.replace(/\.[^.]+$/, '');
    return new File([webpBlob], `${baseName}.webp`, { type: 'image/webp' });
  }

  // Lee un archivo como data URL para previews y envio en formulario.
  private fileToDataUrl(file: File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error(`No se pudo leer ${file.name}`));

      reader.readAsDataURL(file);
    });
  }
}
