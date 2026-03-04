import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Ha ocurrido un error desconocido';
      
      if (error.error instanceof ErrorEvent) {
        errorMessage = `Error: ${error.error.message}`;
      } else {
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else {
          switch (error.status) {
            case 400:
              errorMessage = 'Solicitud inválida';
              break;
            case 401:
              errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente';
              localStorage.removeItem('auth_token');
              break;
            case 403:
              errorMessage = 'No tienes permisos para realizar esta acción';
              break;
            case 404:
              errorMessage = 'Recurso no encontrado';
              break;
            case 422:
              errorMessage = 'Error de validación';
              break;
            case 500:
              errorMessage = 'Error interno del servidor';
              break;
            case 503:
              errorMessage = 'Servicio no disponible';
              break;
          }
        }
      }
      
      console.error('HTTP Error:', {
        status: error.status,
        message: errorMessage,
        url: error.url,
        error: error.error
      });
      
      return throwError(() => ({
        status: error.status,
        message: errorMessage,
        errors: error.error?.errors || null,
        originalError: error
      }));
    })
  );
};
