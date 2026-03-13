import { CommonModule } from '@angular/common';
import { Component, Input, TemplateRef } from '@angular/core';

@Component({
  selector: 'app-show-crud',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './show-crud.component.html',
})
export class ShowCrudComponent {
  @Input() title = 'Detalle';
  @Input() contentTemplate: TemplateRef<any> | null = null;
  @Input() context: Record<string, any> = {};
}
