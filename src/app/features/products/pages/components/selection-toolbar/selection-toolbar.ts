import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-selection-toolbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './selection-toolbar.component.html',
})
export class SelectionToolbarComponent {
  @Input() selectedCount = 0;
  @Input() entityLabel = 'items';

  @Output() edit = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() clear = new EventEmitter<void>();
}
