import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CatalogRun } from '../models/run.model';
import { RunStatusBadgeComponent } from './run-status-badge.component';

@Component({
  selector: 'app-run-header',
  standalone: true,
  imports: [CommonModule, DatePipe, RunStatusBadgeComponent],
  template: `
    <header class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 class="text-xl font-semibold text-gray-900 dark:text-white">{{ run?.run_key || ('Run #' + run?.id) }}</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ run?.oam_supplier?.name ?? 'Sin proveedor' }} · {{ run?.oam_supplier?.code ?? ('ID ' + run?.supplier_id) }}
          </p>
        </div>
        <app-run-status-badge [status]="run?.status ?? ''" />
      </div>

      <div class="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <div><span class="text-gray-500 dark:text-gray-400">Tipo fuente:</span> {{ run?.source_type ?? '—' }}</div>
        <div><span class="text-gray-500 dark:text-gray-400">Creado:</span> {{ run?.created_at ? (run?.created_at | date: 'dd/MM/yyyy HH:mm') : '—' }}</div>
        <div><span class="text-gray-500 dark:text-gray-400">Inicio:</span> {{ run?.started_at ? (run?.started_at | date: 'dd/MM/yyyy HH:mm') : '—' }}</div>
      </div>
      <div class="mt-1 text-sm"><span class="text-gray-500 dark:text-gray-400">Fin:</span> {{ run?.finished_at ? (run?.finished_at | date: 'dd/MM/yyyy HH:mm') : '—' }}</div>

      <div class="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          (click)="startClicked.emit()"
          [disabled]="!canStart || isSubmitting"
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400">
          {{ isSubmitting && pendingAction === 'start' ? 'Procesando...' : 'Start run' }}
        </button>
        <button
          type="button"
          (click)="normalizeClicked.emit()"
          [disabled]="!canNormalize || isSubmitting"
          class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-400">
          {{ isSubmitting && pendingAction === 'normalize' ? 'Procesando...' : 'Normalize run' }}
        </button>
      </div>
    </header>
  `,
})
export class RunHeaderComponent {
  @Input() run: CatalogRun | null = null;
  @Input() canStart = false;
  @Input() canNormalize = false;
  @Input() isSubmitting = false;
  @Input() pendingAction: 'start' | 'normalize' | null = null;

  @Output() startClicked = new EventEmitter<void>();
  @Output() normalizeClicked = new EventEmitter<void>();
}
