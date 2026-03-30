import { CommonModule } from '@angular/common';
import { Component, Input, computed, signal } from '@angular/core';

@Component({
  selector: 'app-json-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <button
        type="button"
        (click)="expanded.set(!expanded())"
        class="flex w-full items-center justify-between text-left text-sm font-semibold text-gray-800 dark:text-gray-200">
        <span>JSON preview</span>
        <span class="text-xs text-gray-500">{{ expanded() ? 'Ocultar' : 'Mostrar' }}</span>
      </button>

      @if (expanded()) {
        <pre class="mt-3 max-h-96 overflow-auto rounded-lg bg-gray-900 p-3 text-xs text-green-200">{{ json() }}</pre>
      }
    </section>
  `,
})
export class JsonPreviewComponent {
  @Input({ required: true }) value!: unknown;

  readonly expanded = signal(false);
  readonly json = computed(() => JSON.stringify(this.value, null, 2));
}
