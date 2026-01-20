import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MaintenanceService {
  private maintenanceMode$ = new BehaviorSubject<boolean>(false);
  private maintenanceMessage$ = new BehaviorSubject<string>('');

  constructor(private http: HttpClient) {
    // Check maintenance status every 5 minutes
    interval(300000).subscribe(() => {
      this.checkMaintenanceStatus();
    });
  }

  /**
   * Check if the application is in maintenance mode
   */
  checkMaintenanceStatus(): void {
    this.http.get<{ maintenance: boolean; message?: string }>(`${environment.apiBaseUrl}/maintenance/status`)
      .pipe(
        catchError(() => {
          // If the endpoint fails, assume not in maintenance mode
          return [{ maintenance: false, message: '' }];
        })
      )
      .subscribe(response => {
        this.maintenanceMode$.next(response.maintenance);
        this.maintenanceMessage$.next(response.message || '');
      });
  }

  /**
   * Get observable for maintenance mode status
   */
  getMaintenanceModeObservable(): Observable<boolean> {
    return this.maintenanceMode$.asObservable();
  }

  /**
   * Get observable for maintenance message
   */
  getMaintenanceMessageObservable(): Observable<string> {
    return this.maintenanceMessage$.asObservable();
  }

  /**
   * Get current maintenance mode status (synchronous)
   */
  isInMaintenanceMode(): boolean {
    return this.maintenanceMode$.value;
  }

  /**
   * Get current maintenance message (synchronous)
   */
  getMaintenanceMessage(): string {
    return this.maintenanceMessage$.value;
  }
}
