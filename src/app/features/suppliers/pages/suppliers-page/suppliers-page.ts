import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { OamSupplier } from '../../../../core/models';
import { getApiUrl } from '../../../../core/config/api.config';

@Component({
  selector: 'app-suppliers-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './suppliers-page.html',
  styleUrl: './suppliers-page.scss',
})
export class SuppliersPage implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = getApiUrl('suppliers');

  suppliers = signal<OamSupplier[]>([]);
  isLoading = signal(false);
  searchTerm = signal('');
  showModal = signal(false);
  showDeleteModal = signal(false);
  isEditMode = signal(false);
  currentSupplier = signal<Partial<OamSupplier>>({
    code: '',
    name: '',
    supplier_type: 'distributor',
    is_active: true,
    default_currency: 'USD',
    settings: {}
  });

  supplierToDelete = signal<OamSupplier | null>(null);

  filteredSuppliers = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.suppliers();

    return this.suppliers().filter(supplier =>
      supplier.name.toLowerCase().includes(term) ||
      supplier.code.toLowerCase().includes(term) ||
      supplier.supplier_type.toLowerCase().includes(term)
    );
  });

  ngOnInit() {
    this.loadSuppliers();
  }

  loadSuppliers() {
    this.isLoading.set(true);
    this.http.get<OamSupplier[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.suppliers.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading suppliers:', error);
        this.isLoading.set(false);
      }
    });
  }

  openCreateModal() {
    this.isEditMode.set(false);
    this.currentSupplier.set({
      code: '',
      name: '',
      supplier_type: 'distributor',
      is_active: true,
      default_currency: 'USD',
      settings: {}
    });
    this.showModal.set(true);
  }

  openEditModal(supplier: OamSupplier) {
    this.isEditMode.set(true);
    this.currentSupplier.set({ ...supplier });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.currentSupplier.set({
      code: '',
      name: '',
      supplier_type: 'distributor',
      is_active: true,
      default_currency: 'USD',
      settings: {}
    });
  }

  saveSupplier() {
    const supplier = this.currentSupplier();

    if (this.isEditMode()) {
      this.http.put<OamSupplier>(`${this.apiUrl}/${supplier.id}`, supplier).subscribe({
        next: (updated) => {
          const index = this.suppliers().findIndex(s => s.id === updated.id);
          if (index !== -1) {
            const newSuppliers = [...this.suppliers()];
            newSuppliers[index] = updated;
            this.suppliers.set(newSuppliers);
          }
          this.closeModal();
        },
        error: (error) => console.error('Error updating supplier:', error)
      });
    } else {
      this.http.post<OamSupplier>(this.apiUrl, supplier).subscribe({
        next: (created) => {
          this.suppliers.set([...this.suppliers(), created]);
          this.closeModal();
        },
        error: (error) => console.error('Error creating supplier:', error)
      });
    }
  }

  openDeleteModal(supplier: OamSupplier) {
    this.supplierToDelete.set(supplier);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.supplierToDelete.set(null);
  }

  confirmDelete() {
    const supplier = this.supplierToDelete();
    if (!supplier) return;

    this.http.delete(`${this.apiUrl}/${supplier.id}`).subscribe({
      next: () => {
        this.suppliers.set(this.suppliers().filter(s => s.id !== supplier.id));
        this.closeDeleteModal();
      },
      error: (error) => console.error('Error deleting supplier:', error)
    });
  }

  updateField(field: keyof OamSupplier, value: any) {
    this.currentSupplier.update(supplier => ({
      ...supplier,
      [field]: value
    }));
  }

  getSupplierTypeLabel(type: string): string {
    const types: Record<string, string> = {
      'distributor': 'Distributor',
      'manufacturer': 'Manufacturer',
      'wholesaler': 'Wholesaler',
      'dropshipper': 'Dropshipper'
    };
    return types[type] || type;
  }

  getSupplierTypeBadgeClass(type: string): string {
    const classes: Record<string, string> = {
      'distributor': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'manufacturer': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'wholesaler': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'dropshipper': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
    };
    return classes[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
}