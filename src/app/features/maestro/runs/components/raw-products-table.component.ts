import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RawProduct, RawProductsPagination } from '../models/raw-product.model';

@Component({
  selector: 'app-raw-products-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div class="flex flex-col gap-3 border-b border-gray-100 p-4 dark:border-gray-700 md:flex-row md:items-center md:justify-between">
        <h2 class="text-base font-semibold text-gray-900 dark:text-white">Productos raw procesados</h2>
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            [ngModel]="searchDraft()"
            (ngModelChange)="searchDraft.set($event)"
            (keyup.enter)="onSearch()"
            placeholder="Buscar por SKU, nombre, marca..."
            class="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          <button type="button" (click)="onSearch()" class="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Buscar
          </button>
        </div>
      </div>

      @if (errorMessage) {
        <div class="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/30 dark:text-red-300">{{ errorMessage }}</div>
      }

      @if (isLoading && products.length === 0) {
        <div class="space-y-3 p-4">
          @for (item of [1,2,3,4,5]; track item) {
            <div class="h-14 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
          }
        </div>
      } @else if (products.length === 0) {
        <div class="p-10 text-center">
          <p class="text-sm text-gray-500 dark:text-gray-400">No hay productos raw para este run.</p>
        </div>
      } @else {
        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-xs text-gray-500 dark:text-gray-400 md:text-sm">
            <thead class="bg-gray-50 text-[11px] uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-300">
              <tr>
                <th class="px-3 py-3">Preview</th>
                <th class="px-3 py-3">SKU</th>
                <th class="px-3 py-3">Name/Description</th>
                <th class="px-3 py-3">Brand</th>
                <th class="px-3 py-3">Family</th>
                <th class="px-3 py-3">Model</th>
                <th class="px-3 py-3">Color</th>
                <th class="px-3 py-3">Size</th>
                <th class="px-3 py-3">Cost</th>
                <th class="px-3 py-3">Qty</th>
                <th class="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (product of products; track product.id) {
                <tr class="border-t border-gray-100 align-top dark:border-gray-700">
                  <td class="px-3 py-3">
                    @if (product.media.thumbnail_main_url) {
                      <button type="button" (click)="openGallery(product)" class="block">
                        <img [src]="product.media.thumbnail_main_url" [alt]="product.name_raw ?? 'preview'" class="h-12 w-12 rounded border border-gray-200 object-cover dark:border-gray-600" />
                      </button>
                    } @else {
                      <div class="flex h-12 w-12 items-center justify-center rounded border border-dashed border-gray-300 text-[10px] text-gray-400 dark:border-gray-600">No img</div>
                    }
                  </td>
                  <td class="px-3 py-3">
                    <p class="font-medium text-gray-900 dark:text-white">{{ product.supplier_sku ?? '—' }}</p>
                    <p class="text-[11px] text-gray-400">{{ product.supplier_product_id ?? '—' }}</p>
                  </td>
                  <td class="px-3 py-3 min-w-56">
                    <p class="font-medium text-gray-900 dark:text-white">{{ product.name_raw ?? 'Sin nombre' }}</p>
                    <p class="line-clamp-2 text-[11px] text-gray-500">{{ product.collection_raw ?? '—' }}</p>
                  </td>
                  <td class="px-3 py-3">{{ product.brand_raw ?? '—' }}</td>
                  <td class="px-3 py-3">{{ product.family_raw ?? '—' }}</td>
                  <td class="px-3 py-3">{{ product.model_raw ?? '—' }}</td>
                  <td class="px-3 py-3">{{ product.color_raw ?? '—' }}</td>
                  <td class="px-3 py-3">{{ product.size_raw ?? '—' }}</td>
                  <td class="px-3 py-3">{{ product.cost_raw ?? '—' }} {{ product.currency_raw ?? '' }}</td>
                  <td class="px-3 py-3">{{ product.qty_raw ?? '—' }}</td>
                  <td class="px-3 py-3">
                    <button type="button" (click)="openPayload(product)" class="rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">
                      Ver payload
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <div class="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between dark:border-gray-700">
        <div class="flex items-center gap-2">
          <span class="text-gray-500 dark:text-gray-400">Filas por pagina</span>
          <select [ngModel]="pagination.per_page" (ngModelChange)="perPageChange.emit(+$event)" class="rounded border border-gray-300 bg-gray-50 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700">
            @for (size of [10, 25, 50, 100]; track size) {
              <option [ngValue]="size">{{ size }}</option>
            }
          </select>
        </div>
        <p class="text-gray-500 dark:text-gray-400">Pagina {{ pagination.current_page }} de {{ pagination.last_page }} · total {{ pagination.total }}</p>
        <div class="flex gap-2">
          <button type="button" [disabled]="pagination.current_page <= 1" (click)="pageChange.emit(pagination.current_page - 1)" class="rounded border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:hover:bg-gray-700">Anterior</button>
          <button type="button" [disabled]="pagination.current_page >= pagination.last_page" (click)="pageChange.emit(pagination.current_page + 1)" class="rounded border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:hover:bg-gray-700">Siguiente</button>
        </div>
      </div>
    </section>

    @if (payloadModalOpen() && selectedPayload()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
        <div class="h-[80vh] w-full max-w-4xl rounded-lg bg-white shadow-lg dark:bg-gray-800">
          <div class="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Raw Payload · Producto #{{ selectedPayload()?.id }}</h3>
            <button type="button" (click)="closePayload()" class="rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">Cerrar</button>
          </div>
          <div class="h-[calc(80vh-56px)] overflow-auto p-4">
            <pre class="rounded bg-gray-900 p-4 text-xs text-green-200">{{ formatPayload(selectedPayload()?.raw_payload) }}</pre>
          </div>
        </div>
      </div>
    }

    @if (galleryModalOpen() && selectedGalleryProduct()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4">
        <div class="w-full max-w-3xl rounded-lg bg-white shadow-lg dark:bg-gray-800">
          <div class="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Galeria raw · Producto #{{ selectedGalleryProduct()?.id }}</h3>
            <button type="button" (click)="closeGallery()" class="rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">Cerrar</button>
          </div>
          <div class="max-h-[70vh] space-y-3 overflow-auto p-4">
            @if ((selectedGalleryProduct()?.media?.full_urls?.length ?? 0) === 0) {
              <p class="text-sm text-gray-500 dark:text-gray-400">No hay imagenes full para este producto.</p>
            }
            @for (imagePath of selectedGalleryProduct()?.media?.full_urls ?? []; track imagePath) {
              <article class="space-y-2 rounded border border-gray-200 p-3 dark:border-gray-700">
                <img [src]="imagePath" alt="raw image" class="max-h-60 w-full rounded object-contain" />
                <p class="break-all text-xs text-gray-500 dark:text-gray-400">{{ imagePath }}</p>
              </article>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class RawProductsTableComponent implements OnChanges {
  @Input() products: RawProduct[] = [];
  @Input() isLoading = false;
  @Input() errorMessage: string | null = null;
  @Input() pagination: RawProductsPagination = {
    current_page: 1,
    last_page: 1,
    per_page: 25,
    total: 0,
  };
  @Input() search = '';

  @Output() pageChange = new EventEmitter<number>();
  @Output() perPageChange = new EventEmitter<number>();
  @Output() searchChange = new EventEmitter<string>();

  readonly payloadModalOpen = signal(false);
  readonly galleryModalOpen = signal(false);
  readonly selectedPayload = signal<RawProduct | null>(null);
  readonly selectedGalleryProduct = signal<RawProduct | null>(null);
  readonly searchDraft = signal('');

  ngOnChanges(): void {
    this.searchDraft.set(this.search);
  }

  onSearch(): void {
    this.searchChange.emit(this.searchDraft().trim());
  }

  openPayload(product: RawProduct): void {
    this.selectedPayload.set(product);
    this.payloadModalOpen.set(true);
  }

  closePayload(): void {
    this.payloadModalOpen.set(false);
    this.selectedPayload.set(null);
  }

  openGallery(product: RawProduct): void {
    this.selectedGalleryProduct.set(product);
    this.galleryModalOpen.set(true);
  }

  closeGallery(): void {
    this.galleryModalOpen.set(false);
    this.selectedGalleryProduct.set(null);
  }

  formatPayload(payload: unknown): string {
    if (typeof payload === 'string') {
      try {
        return JSON.stringify(JSON.parse(payload), null, 2);
      } catch {
        return payload;
      }
    }

    try {
      return JSON.stringify(payload, null, 2);
    } catch {
      return String(payload ?? 'null');
    }
  }
}
