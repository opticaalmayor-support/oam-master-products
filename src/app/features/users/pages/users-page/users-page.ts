import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  MaestroAdminUser,
  MaestroAdminUserPayload,
  MaestroUsersService,
} from '../../../../core/services/maestro/users/maestro-users.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './users-page.html',
  styleUrl: './users-page.scss',
})
export class UsersPage implements OnInit {
  // Inyecta servicio de usuarios admin Maestro.
  private usersService = inject(MaestroUsersService);
  // Inyecta servicio de auth para validar sesion antes de CRUD admin.
  private authService = inject(AuthService);
  // Inyecta builder de formularios reactivos.
  private fb = inject(FormBuilder);

  // Mantiene el listado de usuarios en memoria reactiva.
  readonly users = signal<MaestroAdminUser[]>([]);
  // Controla estado de carga para feedback de UI.
  readonly isLoading = signal(false);
  // Controla apertura del modal create/edit.
  readonly showModal = signal(false);
  // Controla apertura del modal de confirmacion de borrado.
  readonly showDeleteModal = signal(false);
  // Marca si el modal actual esta en modo edicion.
  readonly isEditMode = signal(false);
  // Guarda mensaje de error para visualizacion.
  readonly errorMessage = signal<string | null>(null);
  // Guarda termino de busqueda para filtrar tabla.
  readonly searchTerm = signal('');
  // Guarda usuario seleccionado para eliminar.
  readonly userToDelete = signal<MaestroAdminUser | null>(null);
  // Guarda id del usuario en edicion.
  readonly editingUserId = signal<number | null>(null);

  // Define formulario de alta/edicion de usuarios.
  readonly userForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.minLength(8)]],
    is_active: [true],
  });

  // Filtra listado por nombre o correo.
  readonly filteredUsers = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();

    if (!term) {
      return this.users();
    }

    return this.users().filter(
      (user) =>
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        String(user.id).includes(term),
    );
  });

  // Carga listado inicial al abrir la pantalla.
  ngOnInit(): void {
    this.loadUsers();
  }

  // Solicita lista de usuarios al backend.
  loadUsers(): void {
    void this.runWithValidSession(async () => {
      this.errorMessage.set(null);
      this.isLoading.set(true);

      try {
        const users = await firstValueFrom(this.usersService.list());
        this.users.set(users);
      } catch (error) {
        this.errorMessage.set(
          this.getReadableError(error as { status?: number; message?: string }, 'No fue posible cargar usuarios'),
        );
      } finally {
        this.isLoading.set(false);
      }
    });
  }

  // Abre modal en modo crear y limpia formulario.
  openCreateModal(): void {
    this.isEditMode.set(false);
    this.editingUserId.set(null);
    this.userForm.reset({ name: '', email: '', password: '', is_active: true });
    this.showModal.set(true);
  }

  // Abre modal en modo editar con datos actuales del usuario.
  openEditModal(user: MaestroAdminUser): void {
    this.isEditMode.set(true);
    this.editingUserId.set(user.id);
    this.userForm.reset({
      name: user.name,
      email: user.email,
      password: '',
      is_active: user.is_active,
    });
    this.showModal.set(true);
  }

  // Cierra modal create/edit y limpia errores del formulario.
  closeModal(): void {
    this.showModal.set(false);
    this.userForm.reset({ name: '', email: '', password: '', is_active: true });
    this.userForm.markAsPristine();
    this.userForm.markAsUntouched();
  }

  // Ejecuta create o update segun modo activo.
  saveUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const raw = this.userForm.getRawValue();
    const payload: MaestroAdminUserPayload = {
      name: raw.name.trim(),
      email: raw.email.trim(),
      is_active: raw.is_active,
    };

    if (raw.password.trim()) {
      payload.password = raw.password.trim();
    }

    if (this.isEditMode() && this.editingUserId()) {
      void this.updateUser(this.editingUserId()!, payload);
      return;
    }

    if (!payload.password) {
      this.userForm.get('password')?.setErrors({ required: true });
      return;
    }

    void this.createUser(payload);
  }

  // Crea usuario y refresca listado local.
  private async createUser(payload: MaestroAdminUserPayload): Promise<void> {
    await this.runWithValidSession(async () => {
      try {
        const created = await firstValueFrom(this.usersService.create(payload));
        this.users.set([created, ...this.users()]);
        this.closeModal();
      } catch (error) {
        this.errorMessage.set(
          this.getReadableError(error as { status?: number; message?: string }, 'No fue posible crear usuario'),
        );
      }
    });
  }

  // Actualiza usuario y sincroniza fila en la tabla.
  private async updateUser(id: number, payload: Partial<MaestroAdminUserPayload>): Promise<void> {
    await this.runWithValidSession(async () => {
      try {
        const updated = await firstValueFrom(this.usersService.patch(id, payload));
        this.users.update((items) => items.map((item) => (item.id === updated.id ? updated : item)));
        this.closeModal();
      } catch (error) {
        this.errorMessage.set(
          this.getReadableError(error as { status?: number; message?: string }, 'No fue posible actualizar usuario'),
        );
      }
    });
  }

  // Abre confirmacion de borrado para usuario seleccionado.
  openDeleteModal(user: MaestroAdminUser): void {
    this.userToDelete.set(user);
    this.showDeleteModal.set(true);
  }

  // Cierra modal de borrado.
  closeDeleteModal(): void {
    this.userToDelete.set(null);
    this.showDeleteModal.set(false);
  }

  // Elimina usuario seleccionado y actualiza lista local.
  confirmDelete(): void {
    const user = this.userToDelete();

    if (!user) {
      return;
    }

    void this.runWithValidSession(async () => {
      try {
        await firstValueFrom(this.usersService.remove(user.id));
        this.users.update((items) => items.filter((item) => item.id !== user.id));
      } catch (error) {
        this.errorMessage.set(
          this.getReadableError(error as { status?: number; message?: string }, 'No fue posible eliminar usuario'),
        );
      } finally {
        this.closeDeleteModal();
      }
    });
  }

  // Ejecuta una accion protegida validando sesion Maestro antes de llamar admin/users.
  private async runWithValidSession(action: () => Promise<void>): Promise<void> {
    const hasSession = await firstValueFrom(this.authService.ensureSession());

    if (!hasSession) {
      this.errorMessage.set('Tu sesion expiró. Inicia sesión nuevamente para gestionar usuarios.');
      return;
    }

    await action();
  }

  // Traduce errores tecnicos a mensajes accionables para el usuario.
  private getReadableError(
    error: { status?: number; message?: string },
    fallback: string,
  ): string {
    const message = (error?.message ?? '').toLowerCase();

    if (error?.status === 401 || message.includes('invalid or expired token')) {
      return 'No autorizado para admin/users. Tu token no es admin valido o expiró; inicia sesión nuevamente con un usuario admin.';
    }

    if (error?.status === 403) {
      return 'No tienes permisos de administrador para gestionar usuarios.';
    }

    return error?.message ?? fallback;
  }
}
