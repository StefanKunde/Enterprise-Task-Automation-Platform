import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, switchMap, filter, tap, take } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(private auth: AuthService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.auth.getAccessToken();

    // Keep existing headers; just add Authorization/withCredentials as needed
    let authReq = token
      ? req.clone({
          setHeaders: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        })
      : req.clone({ withCredentials: true });

    return next.handle(authReq).pipe(
      catchError((error) => {
        const is401 =
          error instanceof HttpErrorResponse && error.status === 401;

        // these endpoints should never trigger refresh/login flows
        const nonRefreshEndpoints = ['/auth/register', '/auth/login', '/auth/verify-email'];
        const skipRefresh = nonRefreshEndpoints.some((url) => authReq.url.includes(url));

        // NEW: Optional auth — if caller marks request as optional, do NOT refresh or redirect on 401
        const isOptionalAuth = authReq.headers.has('X-Optional-Auth');

        if (is401 && !authReq.url.endsWith('/auth/refresh') && !skipRefresh) {
          if (isOptionalAuth) {
            // Let the component handle the 401 gracefully (e.g., public /pricing page)
            return throwError(() => error);
          }

          // Standard refresh flow
          if (!this.isRefreshing) {
            this.isRefreshing = true;
            this.refreshTokenSubject.next(null);

            return this.auth.refreshToken().pipe(
              tap((res) => {
                this.refreshTokenSubject.next(res.access_token);
                this.isRefreshing = false;
              }),
              switchMap(() => {
                const newToken = this.auth.getAccessToken();
                const retryReq = req.clone({
                  setHeaders: newToken ? { Authorization: `Bearer ${newToken}` } : {},
                  withCredentials: true,
                });
                return next.handle(retryReq);
              }),
              catchError((err) => {
                this.isRefreshing = false;
                // Cleanup + redirect to login for real protected flows
                this.auth.logout().subscribe({ error: () => {} });
                this.router.navigate(['/auth/login']);
                return throwError(() => err);
              })
            );
          } else {
            // Queue while a refresh is in flight
            return this.refreshTokenSubject.pipe(
              filter((tkn) => tkn !== null),
              take(1),
              switchMap((newToken) => {
                const retryReq = req.clone({
                  setHeaders: newToken ? { Authorization: `Bearer ${newToken}` } : {},
                  withCredentials: true,
                });
                return next.handle(retryReq);
              })
            );
          }
        }

        return throwError(() => error);
      })
    );
  }
}
