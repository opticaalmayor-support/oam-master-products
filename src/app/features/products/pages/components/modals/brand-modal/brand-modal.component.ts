import { OamBrand } from '../../../../../../core/models';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'app-brand-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './brand-modal.component.html',
})
export class BrandModalComponent implements OnChanges {
  @Input() open = false;
  @Input() embedded = false;
  @Input() mode: 'create' | 'edit' | 'show' = 'create';
  @Input() brand: Partial<OamBrand> | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<Partial<OamBrand>>();

  form!: FormGroup;
  private readonly nonNumericTextPattern = /^(?!\d+$).+/;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      name: [
        '',
        [
          Validators.required,
          Validators.maxLength(190),
          Validators.pattern(this.nonNumericTextPattern),
        ],
      ],
      slug: ['', [Validators.required, Validators.maxLength(190)]],
      is_active: [true],
    });
  }

  getControl(fieldKey: string): AbstractControl | null {
    return this.form.get(fieldKey);
  }

  shouldShowFieldError(fieldKey: string): boolean {
    const control = this.getControl(fieldKey);
    return Boolean(control && control.invalid && (control.touched || control.dirty));
  }

  getFieldErrorMessage(fieldKey: string, label: string): string {
    const control = this.getControl(fieldKey);

    if (!control?.errors) {
      return '';
    }

    if (control.errors['required']) {
      return `${label} es obligatorio.`;
    }

    if (control.errors['maxlength']) {
      return `${label} supera el maximo permitido.`;
    }

    if (control.errors['pattern']) {
      return `${label} no puede contener solo numeros.`;
    }

    return `Revisa el valor de ${label.toLowerCase()}.`;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['brand'] || changes['mode'] || changes['open']) {
      this.patchForm();
      this.toggleFormState();
    }
  }

  get title(): string {
    if (this.mode === 'edit') return 'Editar Marca';
    if (this.mode === 'show') return 'Detalle de Marca';
    return 'Nueva Marca';
  }

  get submitLabel(): string {
    return this.mode === 'edit' ? 'Actualizar Marca' : 'Guardar Marca';
  }

  onClose(): void {
    this.closed.emit();
  }

  onSubmit(): void {
    if (this.mode === 'show') {
      this.onClose();
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitted.emit(this.form.getRawValue());
  }

  private patchForm(): void {
    this.form.reset({
      name: this.brand?.name ?? '',
      slug: this.brand?.slug ?? '',
      is_active: this.brand?.is_active ?? true,
    });
  }

  private toggleFormState(): void {
    if (this.mode === 'show') {
      this.form.disable({ emitEvent: false });
    } else {
      this.form.enable({ emitEvent: false });
    }
  }
}
