import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { getApiUrl } from '../../../config/api.config';

export interface MaestroAdminUser {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  last_login_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface MaestroAdminUserPayload {
  name: string;
  email: string;
  password?: string;
  is_active: boolean;
}

export interface MaestroUsersListFilters {
  search?: string;
  is_active?: boolean;
  per_page?: number;
}

@Injectable({ providedIn: 'root' })
export class MaestroUsersService {
  // Inyecta HttpClient para consumir endpoints admin de usuarios.
  private http = inject(HttpClient);

  // Resuelve la URL base del endpoint de usuarios Maestro admin.
  private readonly usersUrl = getApiUrl('maestroAdminUsers');

  // Lista usuarios y soporta filtros search/is_active/per_page.
  list(filters: MaestroUsersListFilters = {}): Observable<MaestroAdminUser[]> {
    const query = new URLSearchParams();

    if (filters.search?.trim()) {
      query.set('search', filters.search.trim());
    }

    if (typeof filters.is_active === 'boolean') {
      query.set('is_active', filters.is_active ? '1' : '0');
    }

    if (typeof filters.per_page === 'number' && filters.per_page > 0) {
      query.set('per_page', String(filters.per_page));
    }

    const url = query.size ? `${this.usersUrl}?${query.toString()}` : this.usersUrl;

    return this.http
      .get<
        | MaestroAdminUser[]
        | { data?: MaestroAdminUser[] }
        | { data?: { data?: MaestroAdminUser[] } }
      >(url)
      .pipe(
      map((response) => {
        if (Array.isArray(response)) {
          return response;
        }

        if (Array.isArray(response.data)) {
          return response.data;
        }

        if (
          response.data &&
          typeof response.data === 'object' &&
          'data' in response.data &&
          Array.isArray(response.data.data)
        ) {
          return response.data.data;
        }

        return [];
      }),
    );
  }

  // Obtiene detalle de un usuario por id.
  getById(id: number): Observable<MaestroAdminUser> {
    return this.http
      .get<MaestroAdminUser | { data?: MaestroAdminUser }>(`${this.usersUrl}/${id}`)
      .pipe(map((response) => this.unwrapUserResponse(response)));
  }

  // Crea un usuario Maestro mediante endpoint admin.
  create(payload: MaestroAdminUserPayload): Observable<MaestroAdminUser> {
    return this.http
      .post<MaestroAdminUser | { data?: MaestroAdminUser }>(this.usersUrl, payload)
      .pipe(map((response) => this.unwrapUserResponse(response)));
  }

  // Actualiza un usuario Maestro existente por id.
  update(id: number, payload: Partial<MaestroAdminUserPayload>): Observable<MaestroAdminUser> {
    return this.http
      .put<MaestroAdminUser | { data?: MaestroAdminUser }>(`${this.usersUrl}/${id}`, payload)
      .pipe(map((response) => this.unwrapUserResponse(response)));
  }

  // Actualiza parcialmente un usuario Maestro existente por id.
  patch(id: number, payload: Partial<MaestroAdminUserPayload>): Observable<MaestroAdminUser> {
    return this.http
      .patch<MaestroAdminUser | { data?: MaestroAdminUser }>(`${this.usersUrl}/${id}`, payload)
      .pipe(map((response) => this.unwrapUserResponse(response)));
  }

  // Elimina un usuario Maestro por id.
  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.usersUrl}/${id}`);
  }

  // Detecta si una respuesta viene envuelta en la propiedad data.
  private hasWrappedData(
    response: MaestroAdminUser | { data?: MaestroAdminUser },
  ): response is { data: MaestroAdminUser } {
    return typeof response === 'object' && response !== null && 'data' in response && !!response.data;
  }

  // Homologa respuesta de create/update y garantiza que exista usuario valido.
  private unwrapUserResponse(response: MaestroAdminUser | { data?: MaestroAdminUser }): MaestroAdminUser {
    const user = this.hasWrappedData(response) ? response.data : response;

    if (!user || typeof user !== 'object' || !('id' in user)) {
      throw new Error('Respuesta de usuario invalida');
    }

    return user as MaestroAdminUser;
  }
}
