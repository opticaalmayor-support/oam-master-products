import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  @Input() open = false;
  @Input() title = 'Panel';
  @Input() widthClass = 'max-w-2xl';
  @Input() closeOnBackdrop = true;
  @Input() position: 'left' | 'right' = 'right';

  @Output() closed = new EventEmitter<void>();

  onClose(): void {
    this.closed.emit();
  }

  onBackdropClick(): void {
    if (this.closeOnBackdrop) {
      this.onClose();
    }
  }
}
