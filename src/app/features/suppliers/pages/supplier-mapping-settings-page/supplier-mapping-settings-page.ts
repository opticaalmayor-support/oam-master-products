import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { JsonPreviewComponent } from '../../components/json-preview/json-preview.component';
import { MappingTableComponent } from '../../components/mapping-table/mapping-table.component';
import { SupplierSettingsStore } from '../../services/supplier-settings.store';

@Component({
  selector: 'app-supplier-mapping-settings-page',
  standalone: true,
  imports: [CommonModule, RouterLink, MappingTableComponent, JsonPreviewComponent],
  templateUrl: './supplier-mapping-settings-page.html',
})
export class SupplierMappingSettingsPage implements OnInit {
  readonly store = inject(SupplierSettingsStore);
  private readonly route = inject(ActivatedRoute);

  readonly supplierId = signal(0);
  readonly payloadPreview = computed(() => this.store.buildPatchPayload(this.store.draft()));

  ngOnInit(): void {
    const supplierId = Number(this.route.snapshot.paramMap.get('supplierId'));
    this.supplierId.set(Number.isFinite(supplierId) ? supplierId : 0);
    if (this.supplierId() > 0) this.store.load(this.supplierId());
  }

  setMapping(mapping: Record<string, string>): void {
    this.store.setMapping(mapping);
  }

  saveSettings(): void {
    if (this.supplierId() <= 0) return;
    this.store.save(this.supplierId());
  }

  resetChanges(): void {
    this.store.resetDraft();
  }
}
