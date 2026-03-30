import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EndpointPurpose, HttpMethod, SupplierApiEndpoint } from '../../models/supplier-settings.model';

interface KeyValueRow {
  key: string;
  value: string;
}

@Component({
  selector: 'app-endpoint-editor-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (visible) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
        <div class="w-full max-w-3xl rounded-lg bg-white shadow-lg dark:bg-gray-800">
          <div class="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">{{ mode === 'create' ? 'Add endpoint' : 'Editar endpoint' }}</h3>
            <button type="button" (click)="cancel.emit()" class="rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">Cerrar</button>
          </div>

          <div class="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
            <div>
              <label class="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Endpoint key</label>
              <input
                type="text"
                [ngModel]="draftKey()"
                (ngModelChange)="draftKey.set($event)"
                [readonly]="mode === 'edit'"
                class="block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Method</label>
              <select
                [ngModel]="draftMethod()"
                (ngModelChange)="draftMethod.set($event)"
                class="block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                @for (m of methods; track m) {
                  <option [ngValue]="m">{{ m }}</option>
                }
              </select>
            </div>
            <div class="md:col-span-2">
              <label class="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Path</label>
              <input
                type="text"
                [ngModel]="draftPath()"
                (ngModelChange)="draftPath.set($event)"
                class="block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="/products" />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Purpose</label>
              <select
                [ngModel]="draftPurpose()"
                (ngModelChange)="draftPurpose.set($event)"
                class="block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                <option ngValue="none">None</option>
                <option ngValue="login">Login</option>
                <option ngValue="refresh">Refresh</option>
                <option ngValue="run">Run</option>
                <option ngValue="mapping">Mapping</option>
                <option ngValue="get">Get</option>
                <option ngValue="list">List</option>
                <option ngValue="create">Create</option>
                <option ngValue="update">Update</option>
                <option ngValue="delete">Delete</option>
                <option ngValue="health">Health</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">response_items_path</label>
              <input
                type="text"
                [ngModel]="draftItemsPath()"
                (ngModelChange)="draftItemsPath.set($event)"
                class="block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="$.data.items" />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">response_item_path</label>
              <input
                type="text"
                [ngModel]="draftItemPath()"
                (ngModelChange)="draftItemPath.set($event)"
                class="block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="$.data" />
            </div>
          </div>

          <div class="grid grid-cols-1 gap-4 px-4 pb-4 md:grid-cols-2">
            <div class="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              <div class="mb-2 flex items-center justify-between">
                <h4 class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">query_map</h4>
                <button type="button" (click)="addQueryRow()" class="text-xs font-medium text-blue-600 hover:underline">Add</button>
              </div>
              <div class="space-y-2">
                @for (row of queryRows(); track $index) {
                  <div class="grid grid-cols-[1fr_1fr_auto] gap-2">
                    <input type="text" [ngModel]="row.key" (ngModelChange)="updateQueryKey($index, $event)" placeholder="param" class="rounded border border-gray-300 bg-gray-50 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                    <input type="text" [ngModel]="row.value" (ngModelChange)="updateQueryValue($index, $event)" placeholder="$.Path" class="rounded border border-gray-300 bg-gray-50 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                    <button type="button" (click)="removeQueryRow($index)" class="rounded border border-red-300 px-2 text-xs text-red-600">x</button>
                  </div>
                }
              </div>
            </div>

            <div class="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              <div class="mb-2 flex items-center justify-between">
                <h4 class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">headers</h4>
                <button type="button" (click)="addHeaderRow()" class="text-xs font-medium text-blue-600 hover:underline">Add</button>
              </div>
              <div class="space-y-2">
                @for (row of headerRows(); track $index) {
                  <div class="grid grid-cols-[1fr_1fr_auto] gap-2">
                    <input type="text" [ngModel]="row.key" (ngModelChange)="updateHeaderKey($index, $event)" placeholder="Header-Name" class="rounded border border-gray-300 bg-gray-50 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                    <input type="text" [ngModel]="row.value" (ngModelChange)="updateHeaderValue($index, $event)" placeholder="value" class="rounded border border-gray-300 bg-gray-50 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                    <button type="button" (click)="removeHeaderRow($index)" class="rounded border border-red-300 px-2 text-xs text-red-600">x</button>
                  </div>
                }
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 border-t border-gray-200 px-4 py-3 dark:border-gray-700">
            <button type="button" (click)="cancel.emit()" class="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600 dark:text-gray-200">Cancelar</button>
            <button type="button" (click)="onSave()" class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Guardar endpoint</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class EndpointEditorModalComponent implements OnChanges {
  @Input() visible = false;
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() endpointKey = '';
  @Input() endpoint: SupplierApiEndpoint | null = null;
  @Input() methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

  @Output() save = new EventEmitter<{ key: string; endpoint: SupplierApiEndpoint }>();
  @Output() cancel = new EventEmitter<void>();

  readonly draftKey = signal('');
  readonly draftMethod = signal<HttpMethod>('GET');
  readonly draftPath = signal('');
  readonly draftPurpose = signal<EndpointPurpose>('none');
  readonly draftItemsPath = signal('');
  readonly draftItemPath = signal('');
  readonly queryRows = signal<KeyValueRow[]>([]);
  readonly headerRows = signal<KeyValueRow[]>([]);

  ngOnChanges(): void {
    const endpoint = this.endpoint;
    this.draftKey.set(this.endpointKey || '');
    this.draftMethod.set(endpoint?.method ?? 'GET');
    this.draftPath.set(endpoint?.path ?? '');
    this.draftPurpose.set(endpoint?.purpose ?? 'none');
    this.draftItemsPath.set(endpoint?.response_items_path ?? '');
    this.draftItemPath.set(endpoint?.response_item_path ?? '');
    this.queryRows.set(this.toRows(endpoint?.query_map ?? {}));
    this.headerRows.set(this.toRows(endpoint?.headers ?? {}));
  }

  addQueryRow(): void {
    this.queryRows.update((rows) => [...rows, { key: '', value: '' }]);
  }

  removeQueryRow(index: number): void {
    this.queryRows.update((rows) => rows.filter((_, i) => i !== index));
  }

  updateQueryKey(index: number, value: string): void {
    this.queryRows.update((rows) => rows.map((row, i) => (i === index ? { ...row, key: value } : row)));
  }

  updateQueryValue(index: number, value: string): void {
    this.queryRows.update((rows) => rows.map((row, i) => (i === index ? { ...row, value } : row)));
  }

  addHeaderRow(): void {
    this.headerRows.update((rows) => [...rows, { key: '', value: '' }]);
  }

  removeHeaderRow(index: number): void {
    this.headerRows.update((rows) => rows.filter((_, i) => i !== index));
  }

  updateHeaderKey(index: number, value: string): void {
    this.headerRows.update((rows) => rows.map((row, i) => (i === index ? { ...row, key: value } : row)));
  }

  updateHeaderValue(index: number, value: string): void {
    this.headerRows.update((rows) => rows.map((row, i) => (i === index ? { ...row, value } : row)));
  }

  onSave(): void {
    const key = this.draftKey().trim();
    const endpoint: SupplierApiEndpoint = {
      method: this.draftMethod(),
      path: this.draftPath().trim(),
      purpose: this.draftPurpose(),
      query_map: this.toMap(this.queryRows()),
      headers: this.toMap(this.headerRows()),
      response_items_path: this.draftItemsPath().trim() || null,
      response_item_path: this.draftItemPath().trim() || null,
    };

    this.save.emit({ key, endpoint });
  }

  private toRows(map: Record<string, string>): KeyValueRow[] {
    return Object.entries(map).map(([key, value]) => ({ key, value }));
  }

  private toMap(rows: KeyValueRow[]): Record<string, string> {
    return rows.reduce<Record<string, string>>((acc, row) => {
      const key = row.key.trim();
      if (!key) return acc;
      acc[key] = row.value;
      return acc;
    }, {});
  }
}
