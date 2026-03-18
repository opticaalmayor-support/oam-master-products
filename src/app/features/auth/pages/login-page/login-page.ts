import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, LoginCredentials } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage {
  // Inyecta FormBuilder para crear formulario reactivo de login.
  private fb = inject(FormBuilder);
  // Inyecta servicio AuthService para autenticar contra Maestro.
  protected authService = inject(AuthService);
  // Inyecta Router para navegar al dashboard tras login.
  private router = inject(Router);
  // Inyecta ActivatedRoute para respetar query param redirect.
  private route = inject(ActivatedRoute);

  // Guarda mensaje de error visible en UI cuando login falla.
  readonly errorMessage = signal<string | null>(null);

  // Define formulario con validaciones minimas requeridas por backend.
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    remember: [false],
  });

  // Envía credenciales al backend Maestro y redirige al destino solicitado.
  onSubmit(): void {
    // Detiene submit cuando el formulario no cumple validaciones.
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Limpia error previo antes de un nuevo intento de autenticacion.
    this.errorMessage.set(null);

    // Construye payload tipado para el endpoint de login.
    const payload: LoginCredentials = this.form.getRawValue();

    // Ejecuta login y resuelve navegacion por query param redirect.
    this.authService.login(payload).subscribe({
      next: () => {
        // Lee redirect de la URL para volver a la pantalla protegida solicitada.
        const redirect = this.route.snapshot.queryParamMap.get('redirect');
        // Navega al redirect o fallback al dashboard principal.
        void this.router.navigateByUrl(redirect || '/dashboard');
      },
      error: (error: { message?: string }) => {
        // Muestra mensaje de error backend o uno por defecto.
        this.errorMessage.set(error?.message ?? 'No fue posible iniciar sesion.');
      },
    });
  }
}
