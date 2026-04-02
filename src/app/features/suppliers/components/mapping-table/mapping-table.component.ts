import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface AttributeRow {
  key: string;
  source: string;
}

@Component({
  selector: 'app-mapping-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Mapping de campos</h3>
        <div class="flex items-center gap-2">
          <button type="button" (click)="consultMapping()" class="rounded border border-blue-300 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/30">
            Consultar mapping
          </button>
          <button type="button" (click)="clearAllMapping()" class="rounded border border-red-300 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30">
            Clear mapping
          </button>
        </div>
      </div>

      <div class="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3 dark:border-emerald-900/50 dark:bg-emerald-900/10">
        <div class="mb-3">
          <h4 class="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">API -> Raw mapping</h4>
          <p class="mt-1 text-[11px] text-emerald-700/80 dark:text-emerald-300/80">Mapea campos del payload externo hacia el modelo raw.</p>
        </div>

        <div class="mb-4">
          <label class="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Body base (documentacion API)</label>
          <textarea
            [ngModel]="docBody()"
            (ngModelChange)="onDocBodyChange($event)"
            rows="10"
            class="block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-xs font-mono text-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            placeholder='{"Sku": integer, "Name": "string" | null, ...}'></textarea>
          @if (parseError()) {
            <p class="mt-2 text-xs text-red-600 dark:text-red-300">{{ parseError() }}</p>
          }
        </div>

        <div class="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/30">
          <p class="mb-2 text-xs font-medium text-gray-600 dark:text-gray-300">Campos detectados del API externo</p>
          @if (sourceFields().length === 0) {
            <p class="text-xs text-gray-500 dark:text-gray-400">No hay campos detectados aun. Usa "Consultar mapping".</p>
          } @else {
            <div class="flex flex-wrap gap-1.5">
              @for (field of sourceFields(); track field) {
                <button
                  type="button"
                  (click)="addDetectedFieldToAttributes(field)"
                  [class]="
                    'rounded px-2 py-0.5 text-[11px] transition-colors ' +
                    (isUsedInAttributes(field)
                      ? 'bg-violet-100 text-violet-800 ring-1 ring-violet-300 dark:bg-violet-900/40 dark:text-violet-200 dark:ring-violet-700'
                      : isUsedInRawMapping(field)
                        ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-200 dark:ring-emerald-700'
                        : 'bg-white text-gray-700 hover:bg-blue-50 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700')
                  ">
                  {{ field }}
                  @if (getSourceUseCount(field) > 0) {
                    <span
                      [class]="
                        'ml-1 rounded px-1 text-[10px] ' +
                        (isUsedInAttributes(field)
                          ? 'bg-violet-200 text-violet-900 dark:bg-violet-800 dark:text-violet-100'
                          : 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100')
                      ">
                      x{{ getSourceUseCount(field) }}
                    </span>
                  }
                </button>
              }
            </div>
          }
        </div>

        <div class="overflow-x-auto">
          @if (rawLocalFields().length === 0) {
            <p class="mb-2 text-xs text-amber-700 dark:text-amber-300">
              No hay campos locales raw configurables. El campo attributes se configura en la seccion de abajo.
            </p>
          }
          <table class="w-full text-left text-xs text-gray-600 dark:text-gray-300">
            <thead class="bg-gray-50 uppercase text-gray-500 dark:bg-gray-700/50">
              <tr>
                <th class="px-3 py-2">Campo local (raw)</th>
                <th class="px-3 py-2">Campo API externo</th>
                <th class="px-3 py-2">Accion</th>
              </tr>
            </thead>
            <tbody>
              @for (localField of rawLocalFields(); track localField) {
                <tr class="border-t border-gray-100 dark:border-gray-700">
                  <td class="px-3 py-2 font-medium text-gray-900 dark:text-white">{{ localField }}</td>
                  <td class="px-3 py-2">
                    <input
                      [ngModel]="mappedSource(localField)"
                      (ngModelChange)="updateMapping(localField, $event)"
                      [attr.list]="'source-options-' + localField"
                      placeholder="Selecciona o escribe path"
                      class="block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                    <datalist [id]="'source-options-' + localField">
                      @for (field of sourceFields(); track field) {
                        <option [value]="field"></option>
                      }
                    </datalist>
                  </td>
                  <td class="px-3 py-2">
                    <button
                      type="button"
                      (click)="clearMapping(localField)"
                      class="rounded border border-red-300 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30">
                      Clear
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/30">
          <div class="mb-2 flex items-center justify-between">
            <h4 class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Campos extras a attributes</h4>
            <button type="button" (click)="addAttributeRow()" class="rounded border border-violet-300 px-2 py-1 text-[11px] font-medium text-violet-700 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-300 dark:hover:bg-violet-900/30">
              Add attribute
            </button>
          </div>
          <p class="mb-2 text-[11px] text-gray-500 dark:text-gray-400">
            raw.attributes es un solo campo JSON, pero aqui puedes agregar multiples llaves (key -> source) y todas se guardan dentro de attributes.
          </p>

          @if (attributeRows().length === 0) {
            <p class="text-xs text-gray-500 dark:text-gray-400">No hay campos en attributes.</p>
          }

          <div class="space-y-2">
            @for (row of attributeRows(); track $index) {
              <div class="grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_auto]">
                <input
                  [ngModel]="row.key"
                  (ngModelChange)="updateAttributeKey($index, $event)"
                  placeholder="MapPrice"
                  class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                <input
                  [ngModel]="row.source"
                  (ngModelChange)="updateAttributeSource($index, $event)"
                  [attr.list]="'attributes-source-options-' + $index"
                  placeholder="$.MapPrice"
                  class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                <datalist [id]="'attributes-source-options-' + $index">
                  @for (field of sourceFields(); track field) {
                    <option [value]="field"></option>
                  }
                </datalist>
                <button type="button" (click)="removeAttributeRow($index)" class="rounded border border-red-300 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30">Remove</button>
              </div>
            }
          </div>
        </div>
      </div>

      <div class="mt-5 rounded-lg border border-violet-200 bg-violet-50/40 p-3 dark:border-violet-900/50 dark:bg-violet-900/10">
        <div class="mb-3">
          <h4 class="text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">Raw -> Normalized mapping</h4>
          <p class="mt-1 text-[11px] text-violet-700/80 dark:text-violet-300/80">Mapea campos del modelo raw hacia el modelo normalized.</p>
        </div>

      <div class="mb-3 rounded-lg border border-violet-200 bg-white/80 p-2.5 dark:border-violet-900/60 dark:bg-violet-950/20">
        <p class="mb-1 text-[11px] font-medium text-violet-700 dark:text-violet-300">Campos detectados desde mapping raw</p>
        @if (normalizationDetectedFromRaw().length === 0) {
          <p class="text-[11px] text-violet-700/80 dark:text-violet-300/80">Aun no hay campos detectados. Configura primero API -> Raw y/o attributes.</p>
        } @else {
          <div class="flex flex-wrap gap-1.5">
            @for (field of normalizationDetectedFromRaw(); track field) {
              <span
                [class]="
                  'rounded px-2 py-0.5 text-[11px] ' +
                  (isUsedInNormalization(field)
                    ? 'bg-violet-200 text-violet-900 ring-1 ring-violet-300 dark:bg-violet-800/70 dark:text-violet-100 dark:ring-violet-700'
                    : 'bg-white text-violet-800 ring-1 ring-violet-200 dark:bg-violet-900/30 dark:text-violet-200 dark:ring-violet-800')
                ">
                {{ field }}
              </span>
            }
          </div>
        }
      </div>

      <div class="overflow-x-auto">
        @if (normalizedFields.length === 0) {
          <p class="mb-2 text-xs text-amber-700 dark:text-amber-300">
            El backend no envio schema.mapping.local_normalized_fields. No se puede renderizar el mapeo raw -> normalized.
          </p>
        }
        <table class="w-full text-left text-xs text-gray-600 dark:text-gray-300">
          <thead class="bg-gray-50 uppercase text-gray-500 dark:bg-gray-700/50">
            <tr>
              <th class="px-3 py-2">Campo local (normalized)</th>
              <th class="px-3 py-2">Source desde raw</th>
              <th class="px-3 py-2">Accion</th>
            </tr>
          </thead>
          <tbody>
            @for (normalizedField of normalizedFields; track normalizedField) {
              <tr
                [class]="
                  'border-t dark:border-gray-700 ' +
                  (isNormalizationMissing(normalizedField)
                    ? 'border-amber-200 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-900/20'
                    : 'border-gray-100')
                ">
                <td class="px-3 py-2 font-medium text-gray-900 dark:text-white">{{ normalizedField }}</td>
                <td class="px-3 py-2">
                  @if (isCompositeNormalizationField(normalizedField)) {
                    <div class="space-y-2">
                      <div class="flex flex-wrap gap-1.5">
                        @for (source of compositeSources(normalizedField); track source) {
                          <span class="inline-flex items-center gap-1 rounded bg-indigo-100 px-2 py-0.5 text-[11px] text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
                            {{ source }}
                            <button
                              type="button"
                              (click)="removeCompositeSource(normalizedField, source)"
                              class="rounded px-1 text-[10px] hover:bg-indigo-200 dark:hover:bg-indigo-800">
                              x
                            </button>
                          </span>
                        }
                      </div>

                      <div class="grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto]">
                        <input
                          [ngModel]="compositeDraft(normalizedField)"
                          (ngModelChange)="updateCompositeDraft(normalizedField, $event)"
                          [attr.list]="'raw-source-options-' + normalizedField"
                          placeholder="attributes.IsPolarized"
                          [class]="
                            'block w-full rounded-lg border px-3 py-2 text-xs dark:text-white ' +
                            (isNormalizationMissing(normalizedField)
                              ? 'border-amber-400 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20'
                              : 'border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-700')
                          " />
                        <button
                          type="button"
                          (click)="addCompositeSource(normalizedField)"
                          class="rounded border border-indigo-300 px-2 py-1 text-[11px] font-medium text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-900/30">
                          Add source
                        </button>
                      </div>

                      <datalist [id]="'raw-source-options-' + normalizedField">
                        @for (field of normalizationSourceOptions(); track field) {
                          <option [value]="field"></option>
                        }
                      </datalist>
                    </div>
                  } @else {
                    <input
                      [ngModel]="mappedNormalizationSource(normalizedField)"
                      (ngModelChange)="updateNormalizationMapping(normalizedField, $event)"
                      [attr.list]="'raw-source-options-' + normalizedField"
                      placeholder="supplier_sku"
                      [class]="
                        'block w-full rounded-lg border px-3 py-2 text-xs dark:text-white ' +
                        (isNormalizationMissing(normalizedField)
                          ? 'border-amber-400 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20'
                          : 'border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-700')
                      " />
                    <datalist [id]="'raw-source-options-' + normalizedField">
                      @for (field of normalizationSourceOptions(); track field) {
                        <option [value]="field"></option>
                      }
                    </datalist>
                  }
                  @if (isNormalizationMissing(normalizedField)) {
                    <p class="mt-1 text-[11px] font-medium text-amber-700 dark:text-amber-300">Falta asignar source field.</p>
                  }
                </td>
                <td class="px-3 py-2">
                  <button
                    type="button"
                    (click)="clearNormalizationMapping(normalizedField)"
                    class="rounded border border-red-300 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30">
                    Clear
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      </div>
    </section>
  `,
})
export class MappingTableComponent implements OnChanges {
  @Input() mapping: Record<string, string> = {};
  @Input() attributesMapping: Record<string, string> = {};
  @Input() normalizationMapping: Record<string, string> = {};
  @Input() normalizationCompositeMapping: Record<string, string[]> = {};
  @Input() mappingDocBody = '';
  @Input() localFields: string[] = [];
  @Input() normalizedFields: string[] = [];
  @Input() normalizationSourceFields: string[] = [];

  @Output() mappingChange = new EventEmitter<Record<string, string>>();
  @Output() attributesMappingChange = new EventEmitter<Record<string, string>>();
  @Output() normalizationMappingChange = new EventEmitter<Record<string, string>>();
  @Output() normalizationCompositeMappingChange = new EventEmitter<Record<string, string[]>>();
  @Output() mappingDocBodyChange = new EventEmitter<string>();

  readonly map = signal<Record<string, string>>({});
  readonly attributesMap = signal<Record<string, string>>({});
  readonly normalizationMap = signal<Record<string, string>>({});
  readonly normalizationCompositeMap = signal<Record<string, string[]>>({});
  readonly compositeDraftByField = signal<Record<string, string>>({});
  readonly attributeRows = signal<AttributeRow[]>([]);
  readonly docBody = signal('');
  readonly sourceFields = signal<string[]>([]);
  readonly parseError = signal<string | null>(null);
  private readonly compositeFieldSet = new Set(['lens_features']);

  ngOnChanges(): void {
    this.map.set({ ...this.mapping });
    this.attributesMap.set({ ...this.attributesMapping });
    this.normalizationMap.set({ ...this.normalizationMapping });
    const composite = Object.fromEntries(
      Object.entries(this.normalizationCompositeMapping).map(([field, values]) => [field, [...values]]),
    );
    const legacyLensFeature = this.normalizationMapping['lens_features'];
    if (legacyLensFeature && !Array.isArray(composite['lens_features'])) {
      composite['lens_features'] = [legacyLensFeature];
    }
    this.normalizationCompositeMap.set(composite);
    this.attributeRows.set(
      Object.entries(this.attributesMapping).map(([key, source]) => ({ key, source })),
    );
    this.docBody.set(this.mappingDocBody ?? '');

    if (this.docBody().trim()) {
      this.sourceFields.set(this.extractFieldPaths(this.docBody()));
    } else {
      this.sourceFields.set([]);
      this.parseError.set(null);
    }
  }

  onDocBodyChange(value: string): void {
    this.docBody.set(value);
    this.mappingDocBodyChange.emit(value);
  }

  consultMapping(): void {
    const text = this.docBody().trim();
    if (!text) {
      this.sourceFields.set([]);
      this.parseError.set('Pega primero el body base de la documentacion.');
      return;
    }

    const fields = this.extractFieldPaths(text);
    this.sourceFields.set(fields);
    this.parseError.set(fields.length ? null : 'No se detectaron campos. Verifica el formato del body base.');
  }

  clearAllMapping(): void {
    this.map.set({});
    this.mappingChange.emit({});

    this.attributesMap.set({});
    this.attributeRows.set([]);
    this.attributesMappingChange.emit({});

    this.normalizationMap.set({});
    this.normalizationMappingChange.emit({});

    this.normalizationCompositeMap.set({});
    this.normalizationCompositeMappingChange.emit({});

    this.docBody.set('');
    this.mappingDocBodyChange.emit('');

    this.sourceFields.set([]);
    this.parseError.set(null);
  }

  mappedSource(localField: string): string {
    return this.map()[localField] ?? '';
  }

  updateMapping(localField: string, sourceField: string): void {
    const trimmed = sourceField.trim();

    this.map.update((current) => {
      const next = { ...current };

      if (!trimmed) {
        delete next[localField];
      } else {
        next[localField] = trimmed;
      }

      return next;
    });

    this.mappingChange.emit(this.map());
  }

  clearMapping(localField: string): void {
    this.map.update((current) => {
      const next = { ...current };
      delete next[localField];
      return next;
    });

    this.mappingChange.emit(this.map());
  }

  mappedNormalizationSource(normalizedField: string): string {
    return this.normalizationMap()[normalizedField] ?? '';
  }

  updateNormalizationMapping(normalizedField: string, sourceField: string): void {
    const trimmed = sourceField.trim();

    this.normalizationMap.update((current) => {
      const next = { ...current };

      if (!trimmed) {
        delete next[normalizedField];
      } else {
        next[normalizedField] = trimmed;
      }

      return next;
    });

    this.normalizationMappingChange.emit(this.normalizationMap());
  }

  clearNormalizationMapping(normalizedField: string): void {
    this.normalizationMap.update((current) => {
      const next = { ...current };
      delete next[normalizedField];
      return next;
    });

    this.normalizationMappingChange.emit(this.normalizationMap());
  }

  isCompositeNormalizationField(normalizedField: string): boolean {
    return this.compositeFieldSet.has(normalizedField);
  }

  compositeSources(normalizedField: string): string[] {
    return this.normalizationCompositeMap()[normalizedField] ?? [];
  }

  compositeDraft(normalizedField: string): string {
    return this.compositeDraftByField()[normalizedField] ?? '';
  }

  updateCompositeDraft(normalizedField: string, value: string): void {
    this.compositeDraftByField.update((current) => ({ ...current, [normalizedField]: value }));
  }

  addCompositeSource(normalizedField: string): void {
    const source = this.compositeDraft(normalizedField).trim();
    if (!source) return;

    this.normalizationCompositeMap.update((current) => {
      const existing = current[normalizedField] ?? [];
      if (existing.includes(source)) return current;
      return {
        ...current,
        [normalizedField]: [...existing, source],
      };
    });

    this.normalizationMap.update((current) => {
      if (!(normalizedField in current)) return current;
      const next = { ...current };
      delete next[normalizedField];
      return next;
    });

    this.normalizationMappingChange.emit(this.normalizationMap());
    this.normalizationCompositeMappingChange.emit(this.normalizationCompositeMap());
    this.updateCompositeDraft(normalizedField, '');
  }

  removeCompositeSource(normalizedField: string, source: string): void {
    this.normalizationCompositeMap.update((current) => {
      const existing = current[normalizedField] ?? [];
      const next = existing.filter((item) => item !== source);
      const updated = { ...current };

      if (next.length === 0) {
        delete updated[normalizedField];
      } else {
        updated[normalizedField] = next;
      }

      return updated;
    });

    this.normalizationCompositeMappingChange.emit(this.normalizationCompositeMap());
  }

  isNormalizationMissing(normalizedField: string): boolean {
    if (this.isCompositeNormalizationField(normalizedField)) {
      return this.compositeSources(normalizedField).length === 0;
    }

    return !this.mappedNormalizationSource(normalizedField).trim();
  }

  addAttributeRow(): void {
    this.attributeRows.update((rows) => [...rows, { key: '', source: '' }]);
  }

  addDetectedFieldToAttributes(sourceField: string): void {
    const trimmedSource = sourceField.trim();
    if (!trimmedSource) return;

    const existingRows = this.attributeRows();
    if (existingRows.some((row) => row.source.trim() === trimmedSource)) return;

    const baseKey = this.deriveAttributeKeyFromSource(trimmedSource) || 'attribute';
    const key = this.getUniqueAttributeKey(baseKey, existingRows);

    this.attributeRows.update((rows) => [...rows, { key, source: trimmedSource }]);
    this.emitAttributesMap();
  }

  removeAttributeRow(index: number): void {
    this.attributeRows.update((rows) => rows.filter((_, i) => i !== index));
    this.emitAttributesMap();
  }

  updateAttributeKey(index: number, value: string): void {
    this.attributeRows.update((rows) => rows.map((row, i) => (i === index ? { ...row, key: value } : row)));
    this.emitAttributesMap();
  }

  updateAttributeSource(index: number, value: string): void {
    this.attributeRows.update((rows) =>
      rows.map((row, i) => {
        if (i !== index) return row;

        const source = value;
        const key = row.key.trim() ? row.key : this.deriveAttributeKeyFromSource(source);

        return { ...row, source, key };
      }),
    );
    this.emitAttributesMap();
  }

  getSourceUseCount(sourceField: string): number {
    const rawCount = Object.values(this.map()).filter((value) => value === sourceField).length;
    const attributesCount = Object.values(this.attributesMap()).filter((value) => value === sourceField).length;
    return rawCount + attributesCount;
  }

  isUsedInRawMapping(sourceField: string): boolean {
    return Object.values(this.map()).some((value) => value === sourceField);
  }

  isUsedInAttributes(sourceField: string): boolean {
    return Object.values(this.attributesMap()).some((value) => value === sourceField);
  }

  rawLocalFields(): string[] {
    return this.localFields.filter((field) => !this.isAttributesField(field));
  }

  normalizationSourceOptions(): string[] {
    const schemaFields = this.normalizationSourceFields.filter((field) => field.trim().length > 0);
    const detected = this.normalizationDetectedFromRaw();
    const merged = [...schemaFields, ...detected];

    return Array.from(new Set(merged));
  }

  normalizationDetectedFromRaw(): string[] {
    const rawMappedFields = Object.entries(this.map())
      .filter(([, source]) => source.trim().length > 0)
      .map(([rawField]) => rawField.trim())
      .filter((rawField) => rawField.length > 0);

    const attributeMappedFields = this.attributeRows()
      .filter((row) => row.key.trim().length > 0 && row.source.trim().length > 0)
      .map((row) => `attributes.${row.key.trim()}`);

    return Array.from(new Set([...rawMappedFields, ...attributeMappedFields])).sort((a, b) =>
      a.localeCompare(b),
    );
  }

  isUsedInNormalization(sourceField: string): boolean {
    const simpleUsed = Object.values(this.normalizationMap()).some((value) => value === sourceField);
    if (simpleUsed) return true;

    return Object.values(this.normalizationCompositeMap()).some((values) => values.includes(sourceField));
  }

  private isAttributesField(field: string): boolean {
    const normalized = field.trim().toLowerCase();
    if (!normalized) return false;

    const segments = normalized.split('.').filter(Boolean);
    return segments.includes('attributes');
  }

  private emitAttributesMap(): void {
    const map = this.attributeRows().reduce<Record<string, string>>((acc, row) => {
      const key = row.key.trim() || this.deriveAttributeKeyFromSource(row.source);
      const source = row.source.trim();
      if (!key || !source) return acc;
      acc[key] = source;
      return acc;
    }, {});

    this.attributesMap.set(map);
    this.attributesMappingChange.emit(map);
  }

  private deriveAttributeKeyFromSource(source: string): string {
    const cleaned = source.trim().replace(/^\$\.?/, '');
    return cleaned || '';
  }

  private getUniqueAttributeKey(baseKey: string, rows: AttributeRow[]): string {
    const keys = new Set(rows.map((row) => row.key.trim()).filter(Boolean));
    if (!keys.has(baseKey)) return baseKey;

    let index = 2;
    while (keys.has(`${baseKey}_${index}`)) {
      index += 1;
    }

    return `${baseKey}_${index}`;
  }

  private extractFieldPaths(schemaText: string): string[] {
    const result = new Set<string>();
    const stack: string[] = [];
    const lines = schemaText.split(/\r?\n/);

    for (const rawLine of lines) {
      let line = rawLine.trim();
      if (!line) continue;

      line = this.consumeClosings(line, stack);
      if (!line) continue;

      const match = line.match(/^"([^"]+)"\s*:\s*(.+)$/);
      if (!match) continue;

      const key = match[1].trim();
      let value = match[2].trim();
      if (!key) continue;

      value = value.replace(/,$/, '').trim();
      const prefix = stack.length ? `${stack.join('.')}.` : '';

      if (value.startsWith('{')) {
        stack.push(key);
        if (value.includes('}')) stack.pop();
        continue;
      }

      if (value.startsWith('[')) {
        const arrayKey = `${key}[]`;
        stack.push(arrayKey);
        if (value.includes('{')) {
          continue;
        }

        if (value.includes(']')) {
          result.add(`${prefix}${arrayKey}`);
          stack.pop();
        }
        continue;
      }

      result.add(`${prefix}${key}`);
    }

    return Array.from(result);
  }

  private consumeClosings(line: string, stack: string[]): string {
    let rest = line;

    while (rest.length) {
      const char = rest[0];
      if (char === '}' || char === ']') {
        if (stack.length) stack.pop();
        rest = rest.slice(1).trimStart();
        if (rest.startsWith(',')) rest = rest.slice(1).trimStart();
      } else if (char === ',') {
        rest = rest.slice(1).trimStart();
      } else {
        break;
      }
    }

    return rest;
  }
}
