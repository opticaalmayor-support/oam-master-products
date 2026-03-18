import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { CatalogRun } from '../models/run.model';

@Component({
  selector: 'app-run-kpis',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <article class="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/30">
        <p class="text-xs text-blue-700 dark:text-blue-300">Total raw</p>
        <p class="mt-1 text-2xl font-semibold text-blue-900 dark:text-blue-200">{{ run.oam_supplier_product_raws_count ?? 0 }}</p>
      </article>
      <article class="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-900/30">
        <p class="text-xs text-emerald-700 dark:text-emerald-300">Total normalized</p>
        <p class="mt-1 text-2xl font-semibold text-emerald-900 dark:text-emerald-200">{{ run.oam_product_normalizeds_count ?? 0 }}</p>
      </article>
      <article class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <p class="text-xs text-gray-500 dark:text-gray-400">Stats total</p>
        <p class="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{{ run.stats.total }}</p>
      </article>
      <article class="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/30">
        <p class="text-xs text-red-700 dark:text-red-300">Stats errors</p>
        <p class="mt-1 text-2xl font-semibold text-red-900 dark:text-red-200">{{ run.stats.errors }}</p>
      </article>
    </section>
  `,
})
export class RunKpisComponent {
  @Input({ required: true }) run!: CatalogRun;
}
