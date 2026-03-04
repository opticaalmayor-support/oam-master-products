import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { User, UserSession } from '../models';

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  data?: {
    user: User;
    session: UserSession;
    token: string;
  };
}

export interface AuthState {
  user: User | null;
  session: UserSession | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';
  private readonly SESSION_KEY = 'auth_session';

  private authState = signal<AuthState>({
    user: null,
    session: null,
    token: null,
    isAuthenticated: false,
    isLoading: false
  });

  readonly user = computed(() => this.authState().user);
  readonly session = computed(() => this.authState().session);
  readonly token = computed(() => this.authState().token);
  readonly isAuthenticated = computed(() => this.authState().isAuthenticated);
  readonly isLoading = computed(() => this.authState().isLoading);

  constructor() {
    this.loadAuthFromStorage();
  }

  login(credentials: LoginCredentials): Observable<LoginResponse> {
    this.setLoading(true);
    
    return this.http.post<LoginResponse>('/api/auth/login', credentials).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.setAuthData(response.data.user, response.data.session, response.data.token);
        }
      }),
      catchError(error => {
        this.setLoading(false);
        return throwError(() => error);
      }),
      tap(() => this.setLoading(false))
    );
  }

  logout(): Observable<any> {
    return this.http.post('/api/auth/logout', {}).pipe(
      tap(() => {
        this.clearAuthData();
        this.router.navigate(['/login']);
      }),
      catchError(error => {
        this.clearAuthData();
        this.router.navigate(['/login']);
        return throwError(() => error);
      })
    );
  }

  refreshToken(): Observable<LoginResponse> {
    const currentToken = this.token();
    if (!currentToken) {
      return throwError(() => new Error('No token available'));
    }

    return this.http.post<LoginResponse>('/api/auth/refresh', {}).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.setAuthData(response.data.user, response.data.session, response.data.token);
        }
      }),
      catchError(error => {
        this.clearAuthData();
        return throwError(() => error);
      })
    );
  }

  validateSession(): Observable<boolean> {
    return this.http.get<{ valid: boolean }>('/api/auth/validate').pipe(
      map(response => response.valid),
      catchError(() => {
        this.clearAuthData();
        return throwError(() => new Error('Session invalid'));
      })
    );
  }

  private setAuthData(user: User, session: UserSession, token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));

    this.authState.set({
      user,
      session,
      token,
      isAuthenticated: true,
      isLoading: false
    });
  }

  private clearAuthData(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.SESSION_KEY);

    this.authState.set({
      user: null,
      session: null,
      token: null,
      isAuthenticated: false,
      isLoading: false
    });
  }

  private loadAuthFromStorage(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const userStr = localStorage.getItem(this.USER_KEY);
    const sessionStr = localStorage.getItem(this.SESSION_KEY);

    if (token && userStr && sessionStr) {
      try {
        const user = JSON.parse(userStr) as User;
        const session = JSON.parse(sessionStr) as UserSession;
        
        this.authState.set({
          user,
          session,
          token,
          isAuthenticated: true,
          isLoading: false
        });
      } catch (error) {
        console.error('Error loading auth from storage:', error);
        this.clearAuthData();
      }
    }
  }

  private setLoading(isLoading: boolean): void {
    this.authState.update(state => ({ ...state, isLoading }));
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.token();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  hasRole(roleName: string): boolean {
    const user = this.user();
    if (!user || !user.roles) return false;
    return user.roles.some(ur => ur.role?.name === roleName && ur.status === 1);
  }

  hasAnyRole(roleNames: string[]): boolean {
    return roleNames.some(roleName => this.hasRole(roleName));
  }

  hasAllRoles(roleNames: string[]): boolean {
    return roleNames.every(roleName => this.hasRole(roleName));
  }
}
