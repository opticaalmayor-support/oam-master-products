import { CommonModule } from '@angular/common';
import { Component, Input, computed, signal } from '@angular/core';

@Component({
  selector: 'app-json-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div class="flex items-center justify-between gap-2">
        <button
          type="button"
          (click)="expanded.set(!expanded())"
          class="flex w-full items-center justify-between text-left text-sm font-semibold text-gray-800 dark:text-gray-200">
          <span>JSON preview</span>
          <span class="text-xs text-gray-500">{{ expanded() ? 'Ocultar' : 'Mostrar' }}</span>
        </button>
        <button
          type="button"
          (click)="copyJson()"
          class="rounded border border-blue-300 px-2 py-1 text-[11px] font-medium text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/30">
          {{ copyState() === 'copied' ? 'Copiado' : 'Copiar JSON' }}
        </button>
      </div>

      @if (expanded()) {
        <pre class="mt-3 max-h-96 overflow-auto rounded-lg bg-gray-900 p-3 text-xs text-green-200">{{ json() }}</pre>
      }
    </section>
  `,
})
export class JsonPreviewComponent {
  @Input({ required: true }) value!: unknown;

  readonly expanded = signal(false);
  readonly copyState = signal<'idle' | 'copied'>('idle');
  readonly json = computed(() => JSON.stringify(this.value, null, 2));

  copyJson(): void {
    const text = this.json();

    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(text).then(() => {
        this.markCopied();
      });
      return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    this.markCopied();
  }

  private markCopied(): void {
    this.copyState.set('copied');
    setTimeout(() => this.copyState.set('idle'), 1500);
  }
}
