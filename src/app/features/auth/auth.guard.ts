// auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthService } from './auth.service';
import { catchError, map, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean | UrlTree> {
    const token = this.auth.getAccessToken();

    if (!token) {
      return of(this.router.createUrlTree(['/auth/login']));
    }

    if (this.auth.isTokenExpired(token)) {
      // Token ist abgelaufen: versuche refresh
      return this.auth.refreshToken().pipe(
        map(() => {
          return true;
        }),
        catchError(() => {
          // Refresh fehlgeschlagen ➔ redirect
          return of(this.router.createUrlTree(['/auth/login']));
        })
      );
    } else {
      return of(true);
    }
  }
}
