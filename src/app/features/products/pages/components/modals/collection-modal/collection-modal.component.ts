import { OamBrand, OamCollection } from '../../../../../../core/models';
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
  selector: 'app-collection-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './collection-modal.component.html',
})
export class CollectionModalComponent implements OnChanges {
  @Input() open = false;
  @Input() embedded = false;
  @Input() mode: 'create' | 'edit' | 'show' = 'create';
  @Input() collection: Partial<OamCollection> | null = null;
  @Input() brands: OamBrand[] = [];
  @Input() lockedBrandId: number | null = null;

  @Output() closed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<Partial<OamCollection>>();

  form!: FormGroup;
  private readonly nonNumericTextPattern = /^(?!\d+$).+/;

  familyOptions = [
    { value: 'rx', label: 'RX' },
    { value: 'sun', label: 'SUN' },
    { value: 'both', label: 'BOTH' },
    { value: 'unknown', label: 'UNKNOWN' },
  ];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      brand_id: [null, Validators.required],
      name: [
        '',
        [
          Validators.required,
          Validators.maxLength(190),
          Validators.pattern(this.nonNumericTextPattern),
        ],
      ],
      slug: ['', [Validators.required, Validators.maxLength(190)]],
      family_hint: ['unknown', [Validators.maxLength(190)]],
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
    if (changes['collection'] || changes['mode'] || changes['open'] || changes['lockedBrandId']) {
      this.patchForm();
      this.toggleFormState();
    }
  }

  get title(): string {
    if (this.mode === 'edit') return 'Editar Colección';
    if (this.mode === 'show') return 'Detalle de Colección';

    return 'Nueva Colección';
  }

  get submitLabel(): string {
    return this.mode === 'edit' ? 'Actualizar Colección' : 'Guardar Colección';
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
    const brandId = this.lockedBrandId ?? this.collection?.brand_id ?? null;

    this.form.reset({
      brand_id: brandId,
      name: this.collection?.name ?? '',
      slug: this.collection?.slug ?? '',
      family_hint: this.collection?.family_hint ?? 'unknown',
      is_active: this.collection?.is_active ?? true,
    });
  }

  private toggleFormState(): void {
    if (this.mode === 'show') {
      this.form.disable({ emitEvent: false });
      return;
    }

    this.form.enable({ emitEvent: false });

    if (this.lockedBrandId !== null) {
      this.form.get('brand_id')?.disable({ emitEvent: false });
    }
  }
}
