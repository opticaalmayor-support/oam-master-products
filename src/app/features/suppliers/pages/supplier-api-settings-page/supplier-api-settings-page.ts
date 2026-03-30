import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EndpointEditorModalComponent } from '../../components/endpoint-editor-modal/endpoint-editor-modal.component';
import { JsonPreviewComponent } from '../../components/json-preview/json-preview.component';
import { SupplierApiEndpoint } from '../../models/supplier-settings.model';
import { SupplierSettingsStore } from '../../services/supplier-settings.store';

@Component({
  selector: 'app-supplier-api-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, EndpointEditorModalComponent, JsonPreviewComponent],
  templateUrl: './supplier-api-settings-page.html',
})
export class SupplierApiSettingsPage implements OnInit {
  readonly store = inject(SupplierSettingsStore);
  private readonly route = inject(ActivatedRoute);

  readonly supplierId = signal(0);

  readonly endpointRows = computed(() =>
    Object.entries(this.store.draft().api.endpoints).map(([key, endpoint]) => ({ key, endpoint })),
  );

  readonly payloadPreview = computed(() => this.store.buildPatchPayload(this.store.draft()));

  readonly endpointModalOpen = signal(false);
  readonly endpointModalMode = signal<'create' | 'edit'>('create');
  readonly editingEndpointKey = signal('');

  readonly editingEndpoint = computed(() => {
    const key = this.editingEndpointKey();
    if (!key) return null;
    return this.store.draft().api.endpoints[key] ?? null;
  });

  ngOnInit(): void {
    const supplierId = Number(this.route.snapshot.paramMap.get('supplierId'));
    this.supplierId.set(Number.isFinite(supplierId) ? supplierId : 0);
    if (this.supplierId() > 0) this.store.load(this.supplierId());
  }

  setBaseUrl(value: string): void {
    this.store.updateBaseUrl(value);
  }

  setTimeout(value: string): void {
    const parsed = Number(value);
    this.store.updateTimeoutSeconds(Number.isFinite(parsed) && parsed > 0 ? parsed : null);
  }

  openCreateEndpoint(): void {
    this.endpointModalMode.set('create');
    this.editingEndpointKey.set('');
    this.endpointModalOpen.set(true);
  }

  openEditEndpoint(key: string): void {
    this.endpointModalMode.set('edit');
    this.editingEndpointKey.set(key);
    this.endpointModalOpen.set(true);
  }

  closeEndpointModal(): void {
    this.endpointModalOpen.set(false);
  }

  saveEndpoint(event: { key: string; endpoint: SupplierApiEndpoint }): void {
    if (!event.key.trim()) {
      this.store.fieldErrors.set({ ...this.store.fieldErrors(), endpoint_key: ['La clave del endpoint es requerida.'] });
      return;
    }

    this.store.upsertEndpoint(event.key.trim(), event.endpoint);
    this.store.fieldErrors.set({});
    this.closeEndpointModal();
  }

  removeEndpoint(key: string): void {
    this.store.removeEndpoint(key);
  }

  saveSettings(): void {
    if (this.supplierId() <= 0) return;
    this.store.save(this.supplierId());
  }

  resetChanges(): void {
    this.store.resetDraft();
  }
}
