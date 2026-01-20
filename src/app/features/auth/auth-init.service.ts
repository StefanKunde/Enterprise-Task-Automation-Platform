import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { jwtDecode } from 'jwt-decode';

@Injectable({ providedIn: 'root' })
export class AuthInitService {
  constructor(private auth: AuthService) {}

  async init(): Promise<void> {
    const token = this.auth.getAccessToken();
    if (!token) {
      this.auth.setAuthCheckDone(true);
      return;
    }

    try {
      const { exp } = jwtDecode(token) as { exp: number };
      const isExpired = Date.now() >= exp * 1000;

      if (isExpired) {
        await this.auth.refreshToken().toPromise();
      }
    } catch {
      // Token invalid oder Refresh schlägt fehl => ignorieren
    } finally {
      this.auth.setAuthCheckDone(true); // 🛡️ Immer abschließen, egal was passiert
    }
  }
}
