import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, catchError, throwError, Observable, map, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private loggedIn$ = new BehaviorSubject<boolean>(this.isLoggedIn());
  private userRefresh$ = new BehaviorSubject<void>(undefined);
  private isAuthCheckDone$ = new BehaviorSubject<boolean>(false);
  private refreshTimer: any;

  constructor(private http: HttpClient) {
    this.setupAutoRefresh();
  }

  getAuthCheckDoneObservable() {
    return this.isAuthCheckDone$.asObservable();
  }

  setAuthCheckDone(done: boolean) {
    this.isAuthCheckDone$.next(done);
  }

  register(email: string, password: string, username: string) {
    return this.http.post(`${environment.apiBaseUrl}/auth/register`, {
      email,
      password,
      username,
    });
  }

  login(email: string, password: string): Observable<void> {
    return this.http
      .post<{ access_token: string }>(
        `${environment.apiBaseUrl}/auth/login`,
        { email, password },
        { withCredentials: true }
      )
      .pipe(
        tap((res) => {
          localStorage.setItem('access_token', res.access_token);
          this.setLoginStatus(true);
          this.setupAutoRefresh();
        }),
        map(() => void 0)
      );
  }

  logout() {
    return this.http
      .post(`${environment.apiBaseUrl}/auth/logout`, {}, {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      })
      .pipe(tap(() => {
        localStorage.removeItem('access_token');
        this.setLoginStatus(false);
        clearTimeout(this.refreshTimer);
      }));
  }

  refreshToken() {
    return this.http
      .post<{ access_token: string }>(
        `${environment.apiBaseUrl}/auth/refresh`,
        {},
        { withCredentials: true }
      )
      .pipe(
        tap((res) => {
          localStorage.setItem('access_token', res.access_token);
          this.setLoginStatus(true);
        }),
        catchError((err) => {
          localStorage.removeItem('access_token');
          this.setLoginStatus(false);
          return throwError(() => err);
        })
      );
  }

  private setupAutoRefresh() {
    const token = this.getAccessToken();
    if (!token) return;

    try {
      const { exp } = jwtDecode(token) as { exp: number };
      const expiresInMs = exp * 1000 - Date.now();
      const refreshInMs = expiresInMs - 60_000;

      if (refreshInMs <= 0) {
        this.tryRefreshToken();
      } else {
        clearTimeout(this.refreshTimer);
        this.refreshTimer = setTimeout(() => {
          this.tryRefreshToken();
        }, refreshInMs);
      }
    } catch (err) {
      console.error('Error decoding token:', err);
    }
  }

  private tryRefreshToken() {
    this.refreshToken().subscribe({
      next: () => {
        this.setupAutoRefresh();
      },
      error: () => {
        this.logout().subscribe();
      }
    });
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  isLoggedIn(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    try {
      const { exp } = jwtDecode(token) as { exp: number };
      return Date.now() < exp * 1000;
    } catch {
      return false;
    }
  }

  setLoginStatus(isLoggedIn: boolean) {
    this.loggedIn$.next(isLoggedIn);
  }

  getLoginStatusObservable() {
    return this.loggedIn$.asObservable();
  }

  setAccessToken(token: string) {
    localStorage.setItem('access_token', token);
    this.setLoginStatus(true);
    this.setupAutoRefresh();
  }

  getUserRefreshObservable() {
    return this.userRefresh$.asObservable();
  }

  triggerUserRefresh() {
    this.userRefresh$.next();
  }

  isTokenExpired(token: string): boolean {
    try {
      const { exp } = jwtDecode(token) as { exp: number };
      return Date.now() >= exp * 1000;
    } catch {
      return true;
    }
  }

  resendVerificationEmail(email: string) {
    return this.http.post(`${environment.apiBaseUrl}/auth/request-verification`, { email });
  }

  requestPasswordReset(email: string) {
    return this.http.post(`${environment.apiBaseUrl}/auth/request-password-reset`, { email });
  }

}
