import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Obtiene token maestro desde AuthService para evitar lecturas directas de localStorage.
  const authService = inject(AuthService);
  // Evita adjuntar bearer al endpoint de login para no contaminar credenciales.
  const isLoginEndpoint = req.url.includes('/api/maestro/auth/login');
  // Lee token actual del estado de autenticacion.
  const token = authService.getTokenSnapshot();

  if (token) {
    if (isLoginEndpoint) {
      return next(req);
    }

    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(req);
};
