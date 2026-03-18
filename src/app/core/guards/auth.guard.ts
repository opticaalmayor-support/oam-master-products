import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router, UrlTree } from '@angular/router';
import { map, Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Protege rutas privadas y redirige a /login cuando no hay sesion valida.
export const authGuard: CanActivateFn = (_route, state): Observable<boolean | UrlTree> => {
  // Obtiene instancia del servicio de autenticacion.
  const authService = inject(AuthService);
  // Obtiene instancia de router para crear redirecciones.
  const router = inject(Router);

  // Valida sesion local/remota con /api/maestro/auth/me cuando aplica.
  return authService.ensureSession().pipe(
    // Permite acceso con sesion valida; si no, manda a login con redirect.
    map((isValidSession) =>
      isValidSession
        ? true
        : router.createUrlTree(['/login'], { queryParams: { redirect: state.url } }),
    ),
  );
};

// Reutiliza la misma logica para rutas hijas protegidas bajo Shell.
export const authChildGuard: CanActivateChildFn = (route, state) => authGuard(route, state);
