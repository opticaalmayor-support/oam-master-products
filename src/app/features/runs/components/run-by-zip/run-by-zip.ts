import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject,
  ElementRef,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { OamSupplier, OamSupplierCatalogRun } from '../../../../core/models';
import { getApiUrl } from '../../../../core/config/api.config';

@Component({
  selector: 'app-run-by-zip',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './run-by-zip.html',
  styleUrl: './run-by-zip.scss',
})
export class RunByZip implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private suppliersUrl = getApiUrl('suppliers');
  private uploadUrl = getApiUrl('catalogRunUpload');
  private runsUrl = getApiUrl('catalogRuns');

  fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  suppliers = signal<OamSupplier[]>([]);
  selectedSupplierId = signal<number | null>(null);
  isDragOver = signal(false);
  selectedFile = signal<File | null>(null);
  selectedFiles = signal<File[]>([]);
  isUploading = signal(false);
  uploadError = signal<string | null>(null);
  uploadSuccess = signal(false);
  recentRuns = signal<OamSupplierCatalogRun[]>([]);
  isLoadingRuns = signal(false);
  isAutoRefreshing = signal(false);

  private autoRefreshIntervalId: ReturnType<typeof setInterval> | null = null;
  private readonly autoRefreshMs = 5000;

  selectedSupplier = computed(() =>
    this.suppliers().find(s => s.id === this.selectedSupplierId()) ?? null
  );

  isZip = computed(() => this.selectedFile()?.name.endsWith('.zip') ?? false);

  canUpload = computed(() => {
    const hasSupplier = this.selectedSupplierId() !== null;
    const hasFile = this.selectedFile() !== null || this.selectedFiles().length > 0;
    return hasSupplier && hasFile && !this.isUploading();
  });

  ngOnInit() {
    this.loadSuppliers();
    this.loadRecentRuns();
  }

  ngOnDestroy() {
    this.stopAutoRefresh();
  }

  loadSuppliers() {
    this.http.get<{ data: OamSupplier[] }>(this.suppliersUrl).subscribe({
      next: (res) => this.suppliers.set(res.data.filter(s => s.is_active)),
      error: () => this.suppliers.set([]),
    });
  }

  loadRecentRuns(options: { silent?: boolean } = {}) {
    if (!options.silent) this.isLoadingRuns.set(true);

    this.http.get<OamSupplierCatalogRun[] | { data?: OamSupplierCatalogRun[] }>(this.runsUrl).subscribe({
      next: (res) => {
        const runs = Array.isArray(res) ? res : (res?.data ?? []);
        this.recentRuns.set(runs);
        this.syncAutoRefresh(runs);
        if (!options.silent) this.isLoadingRuns.set(false);
      },
      error: () => {
        this.recentRuns.set([]);
        this.stopAutoRefresh();
        if (!options.silent) this.isLoadingRuns.set(false);
      },
    });
  }

  private syncAutoRefresh(runs: OamSupplierCatalogRun[]) {
    const hasActiveRuns = runs.some(r => r.status === 'pending' || r.status === 'processing');
    if (hasActiveRuns) {
      this.startAutoRefresh();
    } else {
      this.stopAutoRefresh();
    }
  }

  private startAutoRefresh() {
    if (this.autoRefreshIntervalId) return;

    this.isAutoRefreshing.set(true);
    this.autoRefreshIntervalId = setInterval(() => {
      this.loadRecentRuns({ silent: true });
    }, this.autoRefreshMs);
  }

  private stopAutoRefresh() {
    if (this.autoRefreshIntervalId) {
      clearInterval(this.autoRefreshIntervalId);
      this.autoRefreshIntervalId = null;
    }
    this.isAutoRefreshing.set(false);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFiles(Array.from(files));
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFiles(Array.from(input.files));
    }
  }

  handleFiles(files: File[]) {
    this.uploadError.set(null);
    this.uploadSuccess.set(false);

    const allowed = ['.zip', '.xlsx', '.xls'];
    const invalid = files.find(f => !allowed.some(ext => f.name.toLowerCase().endsWith(ext)));
    if (invalid) {
      this.uploadError.set('Solo se permiten archivos .zip, .xlsx o .xls');
      return;
    }

    const hasZip = files.some(f => f.name.toLowerCase().endsWith('.zip'));
    const hasExcel = files.some(f => f.name.toLowerCase().endsWith('.xlsx') || f.name.toLowerCase().endsWith('.xls'));

    if (hasZip && files.length > 1) {
      this.uploadError.set('El archivo ZIP debe subirse solo, sin otros archivos.');
      return;
    }

    if (hasZip && hasExcel) {
      this.uploadError.set('No puedes mezclar ZIP y Excel en la misma carga.');
      return;
    }

    if (hasZip) {
      this.selectedFile.set(files[0]);
      this.selectedFiles.set([]);
    } else {
      this.selectedFiles.set(files);
      this.selectedFile.set(null);
    }
  }

  removeExcelFile(index: number) {
    this.selectedFiles.update(files => files.filter((_, i) => i !== index));
  }

  clearFile() {
    this.selectedFile.set(null);
    this.selectedFiles.set([]);
    this.uploadError.set(null);
    this.uploadSuccess.set(false);
    const input = this.fileInput();
    if (input) input.nativeElement.value = '';
  }

  triggerFileInput() {
    this.fileInput()?.nativeElement.click();
  }

  upload() {
    const supplierId = this.selectedSupplierId();
    if (!supplierId) return;

    this.isUploading.set(true);
    this.uploadError.set(null);
    this.uploadSuccess.set(false);

    const formData = new FormData();
    formData.append('supplier_id', String(supplierId));

    const zipFile = this.selectedFile();
    if (zipFile) {
      formData.append('file', zipFile);
    } else {
      this.selectedFiles().forEach(f => formData.append('files[]', f));
    }

    this.http.post<OamSupplierCatalogRun>(this.uploadUrl, formData).subscribe({
      next: () => {
        this.isUploading.set(false);
        this.uploadSuccess.set(true);
        this.loadRecentRuns();
        this.clearFile();
      },
      error: (err) => {
        this.isUploading.set(false);
        this.uploadError.set(err?.error?.message ?? 'Error al subir el archivo. Intente nuevamente.');
      },
    });
  }

  startRun(run: OamSupplierCatalogRun) {
    this.http.post(`${this.runsUrl}/${run.id}/start`, {}).subscribe({
      next: (updated: any) => {
        this.recentRuns.update(runs =>
          runs.map(r => r.id === run.id ? { ...r, status: updated.status ?? 'processing' } : r)
        );
        this.startAutoRefresh();
        this.loadRecentRuns({ silent: true });
      },
      error: () => {},
    });
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };
    return map[status] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: 'Pendiente',
      processing: 'Procesando',
      completed: 'Completado',
      failed: 'Fallido',
    };
    return map[status] ?? status;
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
