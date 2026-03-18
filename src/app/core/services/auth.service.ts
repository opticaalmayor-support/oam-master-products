import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { getApiUrl } from '../config/api.config';

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface MaestroUser {
  id: number;
  name?: string;
  email?: string;
  status?: string;
  roles?: string[];
  [key: string]: unknown;
}

export interface MaestroSession {
  id?: number;
  expires_at?: string;
  [key: string]: unknown;
}

export interface MaestroLoginData {
  user?: MaestroUser;
  session?: MaestroSession;
  access_token?: string;
  token?: string;
  expires_at?: string;
  id?: number;
  name?: string;
  email?: string;
  is_active?: boolean;
  last_login_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MaestroLoginResponse {
  success?: boolean;
  message?: string;
  token_type?: string;
  access_token?: string;
  expires_at?: string;
  data?: MaestroLoginData;
}

export interface AuthState {
  user: MaestroUser | null;
  session: MaestroSession | null;
  token: string | null;
  expiresAt: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Inyecta HttpClient para consumir endpoints de Maestro Auth.
  private http = inject(HttpClient);
  // Inyecta Router para redirigir entre login y rutas protegidas.
  private router = inject(Router);

  // Define la clave localStorage para el token de Maestro.
  private readonly TOKEN_KEY = 'maestro_auth_token';
  // Define la clave localStorage para la fecha de expiracion.
  private readonly EXPIRES_AT_KEY = 'maestro_auth_expires_at';
  // Define la clave localStorage para usuario serializado.
  private readonly USER_KEY = 'maestro_auth_user';
  // Define la clave localStorage para sesion serializada.
  private readonly SESSION_KEY = 'maestro_auth_session';

  // Guarda el estado de autenticacion global de la app.
  private authState = signal<AuthState>({
    user: null,
    session: null,
    token: null,
    expiresAt: null,
    isAuthenticated: false,
    isLoading: false,
  });

  // Expone el usuario actual como computed signal.
  readonly user = computed(() => this.authState().user);
  // Expone la sesion actual como computed signal.
  readonly session = computed(() => this.authState().session);
  // Expone el token actual como computed signal.
  readonly token = computed(() => this.authState().token);
  // Expone expiracion del token como computed signal.
  readonly expiresAt = computed(() => this.authState().expiresAt);
  // Expone si hay sesion autenticada como computed signal.
  readonly isAuthenticated = computed(() => this.authState().isAuthenticated);
  // Expone estado de carga para UI de auth.
  readonly isLoading = computed(() => this.authState().isLoading);

  // Inicializa auth leyendo sesion persistida en localStorage.
  constructor() {
    this.loadAuthFromStorage();
  }

  // Ejecuta login Maestro y persiste token + expires_at.
  login(credentials: LoginCredentials): Observable<MaestroLoginResponse> {
    this.setLoading(true);

    return this.http
      .post<MaestroLoginResponse>(getApiUrl('maestroAuthLogin'), credentials)
      .pipe(
        tap((response) => {
          // Acepta token en raiz o anidado en data para compatibilidad.
          const token = response.access_token ?? response.data?.access_token ?? response.data?.token ?? null;
          // Acepta expires_at en raiz o anidado en data.
          const expiresAt = response.expires_at ?? response.data?.expires_at ?? null;
          // Soporta user en data.user o data como objeto de usuario.
          const user = this.extractUserFromLoginResponse(response);

          if (token && user) {
            this.setAuthData(user, null, token, expiresAt);
            return;
          }

          // Si backend indica fallo explicito, eleva error legible para UI.
          if (response.success === false) {
            throw new Error(response.message ?? 'Credenciales invalidas');
          }

          // Falla defensiva si no llega token/usuario en formato esperado.
          throw new Error('La respuesta de login no contiene token o usuario valido');
        }),
        catchError((error) => {
          this.setLoading(false);
          return throwError(() => error);
        }),
        tap(() => this.setLoading(false)),
      );
  }

  // Obtiene el usuario autenticado actual desde /me.
  getMe(): Observable<MaestroUser> {
    return this.http.get<unknown>(getApiUrl('maestroAuthMe')).pipe(
      map((response) => {
        if (typeof response === 'object' && response !== null && 'success' in response) {
          const wrapped = response as { success: boolean; data?: MaestroUser };

          if (!wrapped.success || !wrapped.data) {
            throw new Error('No fue posible obtener la sesion de Maestro');
          }

          return wrapped.data;
        }

        if (typeof response === 'object' && response !== null && 'data' in response) {
          const wrapped = response as { data?: MaestroUser };

          if (wrapped.data) {
            return wrapped.data;
          }
        }

        return response as MaestroUser;
      }),
    );
  }

  // Hace bootstrap de sesion validando token local contra /me.
  ensureSession(): Observable<boolean> {
    const token = this.getTokenSnapshot();

    if (!token) {
      return of(false);
    }

    if (this.isTokenExpired(this.expiresAt())) {
      this.clearAuthData();
      return of(false);
    }

    if (this.user()) {
      return of(true);
    }

    this.setLoading(true);

    return this.getMe().pipe(
      tap((me) => {
        this.authState.update((state) => ({
          ...state,
          user: me,
          isAuthenticated: true,
          isLoading: false,
        }));
        localStorage.setItem(this.USER_KEY, JSON.stringify(me));
      }),
      map(() => true),
      catchError(() => {
        this.setLoading(false);
        this.clearAuthData();
        return of(false);
      }),
    );
  }

  // Cierra sesion remota en Maestro y limpia estado local.
  logout(): Observable<void> {
    return this.http.post(getApiUrl('maestroAuthLogout'), {}).pipe(
      map(() => void 0),
      tap(() => {
        this.clearAuthData();
        this.router.navigate(['/login']);
      }),
      catchError((error) => {
        this.clearAuthData();
        this.router.navigate(['/login']);
        return throwError(() => error);
      }),
    );
  }

  // Limpia sesion local de forma segura (uso por interceptores/guards).
  clearAuthData(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.EXPIRES_AT_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.SESSION_KEY);

    this.authState.set({
      user: null,
      session: null,
      token: null,
      expiresAt: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }

  // Entrega el token actual para uso en interceptor HTTP.
  getTokenSnapshot(): string | null {
    const inMemoryToken = this.token();

    if (inMemoryToken) {
      return inMemoryToken;
    }

    // Fallback defensivo: recupera token persistido si el estado reactivo aún no está hidratado.
    const persistedToken = localStorage.getItem(this.TOKEN_KEY);

    if (persistedToken) {
      this.authState.update((state) => ({
        ...state,
        token: persistedToken,
        isAuthenticated: true,
      }));
    }

    return persistedToken;
  }

  // Indica si el token local existe y no esta vencido.
  hasValidToken(): boolean {
    return !!this.getTokenSnapshot() && !this.isTokenExpired(this.expiresAt());
  }

  // Persiste usuario/sesion/token y sincroniza el estado reactivo.
  private setAuthData(
    user: MaestroUser,
    session: MaestroSession | null,
    token: string,
    expiresAt: string | null,
  ): void {
    localStorage.setItem(this.TOKEN_KEY, token);

    if (expiresAt) {
      localStorage.setItem(this.EXPIRES_AT_KEY, expiresAt);
    } else {
      localStorage.removeItem(this.EXPIRES_AT_KEY);
    }

    localStorage.setItem(this.USER_KEY, JSON.stringify(user));

    if (session) {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(this.SESSION_KEY);
    }

    this.authState.set({
      user,
      session,
      token,
      expiresAt,
      isAuthenticated: true,
      isLoading: false,
    });
  }

  // Restaura estado de auth desde localStorage al iniciar la app.
  private loadAuthFromStorage(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const expiresAt = localStorage.getItem(this.EXPIRES_AT_KEY);
    const userStr = localStorage.getItem(this.USER_KEY);
    const sessionStr = localStorage.getItem(this.SESSION_KEY);

    if (!token || this.isTokenExpired(expiresAt)) {
      this.clearAuthData();
      return;
    }

    const user = this.safeJsonParse<MaestroUser>(userStr);
    const session = this.safeJsonParse<MaestroSession>(sessionStr);

    this.authState.set({
      user,
      session,
      token,
      expiresAt,
      isAuthenticated: true,
      isLoading: false,
    });
  }

  // Evalua si una fecha expires_at esta vencida contra Date.now().
  private isTokenExpired(expiresAt: string | null): boolean {
    if (!expiresAt) {
      return false;
    }

    const expiresAtMs = Date.parse(expiresAt);

    if (Number.isNaN(expiresAtMs)) {
      return false;
    }

    return Date.now() >= expiresAtMs;
  }

  // Parsea JSON y devuelve null cuando el valor es invalido.
  private safeJsonParse<T>(value: string | null): T | null {
    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  // Extrae el usuario desde variantes de payload de login Maestro.
  private extractUserFromLoginResponse(response: MaestroLoginResponse): MaestroUser | null {
    const rawData = response.data;

    if (!rawData || typeof rawData !== 'object') {
      return null;
    }

    if ('user' in rawData && rawData.user && typeof rawData.user === 'object') {
      return rawData.user as MaestroUser;
    }

    if ('id' in rawData) {
      return rawData as unknown as MaestroUser;
    }

    return null;
  }

  // Actualiza flag de loading para operaciones de autenticacion.
  private setLoading(isLoading: boolean): void {
    this.authState.update((state) => ({ ...state, isLoading }));
  }
}
