import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-topbar',
  imports: [RouterLink],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
})
export class Topbar {
  // Inyecta AuthService para mostrar datos de usuario y cerrar sesion.
  constructor(protected authService: AuthService) {}

  // Dispara logout Maestro y redirige al login en caso de exito.
  onLogout(): void {
    this.authService.logout().subscribe({
      error: () => {
        // Ignora error porque logout igualmente limpia sesion local.
      },
    });
  }

  // Construye nombre visible del usuario autenticado.
  get displayName(): string {
    const user = this.authService.user();

    if (!user) {
      return 'Usuario';
    }

    return user.name ?? user.email ?? 'Usuario';
  }

  // Construye email visible para el menu de perfil.
  get displayEmail(): string {
    const user = this.authService.user();
    return user?.email ?? 'sin-correo';
  }
}
