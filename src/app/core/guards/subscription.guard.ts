import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class SubscriptionGuard implements CanActivate {
  constructor(private http: HttpClient, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this.http
      .get<{ subscriptionPrimary?: { expiresAt?: string } }>(`${environment.apiBaseUrl}/users/me`, { withCredentials: true })
      .pipe(
        map((user) => {
          const expString = user?.subscriptionPrimary?.expiresAt;
          if (!expString) {
            // User has no subscription
            this.redirectToPricing();
            return false;
          }

          const exp = new Date(expString).getTime();
          const now = Date.now();
          if (exp > now) {
            // Subscription still valid
            return true;
          } else {
            // Subscription expired
            this.redirectToPricing();
            return false;
          }
        }),
        catchError((err) => {
          console.error('[SubscriptionGuard] Error while retrieving user data:', err);
          this.redirectToPricing();
          return of(false);
        })
      );
  }

  private redirectToPricing() {
    this.router.navigate(['/pricing'], {
      state: { message: 'You need an active subscription to access the dashboard.' },
    });
  }
}
