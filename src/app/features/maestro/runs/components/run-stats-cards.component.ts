import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RunStats } from '../models/run.model';

@Component({
  selector: 'app-run-stats-cards',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <article class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <p class="text-xs text-gray-500 dark:text-gray-400">Total</p>
        <p class="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{{ stats.total }}</p>
      </article>
      <article class="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-900/30">
        <p class="text-xs text-green-700 dark:text-green-300">Insertados</p>
        <p class="mt-1 text-2xl font-semibold text-green-900 dark:text-green-200">{{ stats.inserted }}</p>
      </article>
      <article class="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-900/30">
        <p class="text-xs text-yellow-700 dark:text-yellow-300">Saltados</p>
        <p class="mt-1 text-2xl font-semibold text-yellow-900 dark:text-yellow-200">{{ stats.skipped }}</p>
      </article>
      <article class="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/30">
        <p class="text-xs text-red-700 dark:text-red-300">Errores</p>
        <p class="mt-1 text-2xl font-semibold text-red-900 dark:text-red-200">{{ stats.errors }}</p>
      </article>
    </div>
  `,
})
export class RunStatsCardsComponent {
  @Input({ required: true }) stats!: RunStats;
}
