import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { getRunStatusMeta } from '../utils/run-status-map';

@Component({
  selector: 'app-run-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ' + meta.badgeClass">
      {{ meta.label }}
    </span>
  `,
})
export class RunStatusBadgeComponent {
  @Input({ required: true }) status = '';

  get meta() {
    return getRunStatusMeta(this.status);
  }
}
