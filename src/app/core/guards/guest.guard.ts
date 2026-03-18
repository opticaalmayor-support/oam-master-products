import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { map, Observable, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Evita entrar a /login cuando ya existe una sesion autenticada.
export const guestGuard: CanActivateFn = (): Observable<boolean | UrlTree> => {
  // Obtiene instancia del servicio de autenticacion.
  const authService = inject(AuthService);
  // Obtiene instancia del router para redireccionar al dashboard.
  const router = inject(Router);

  // Si no hay token local valido, permite ver login de inmediato.
  if (!authService.hasValidToken()) {
    return of(true);
  }

  // Si hay token, valida sesion y redirige a dashboard cuando sea valida.
  return authService.ensureSession().pipe(
    // Entrega UrlTree al dashboard cuando existe sesion valida.
    map((isValidSession) => (isValidSession ? router.createUrlTree(['/dashboard']) : true)),
  );
};
