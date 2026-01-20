import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CookieConsentService {
  private consentKey = 'cookie_consent';

  hasConsented(): boolean {
    return localStorage.getItem(this.consentKey) === 'true';
  }

  setConsent(value: boolean) {
    localStorage.setItem(this.consentKey, value ? 'true' : 'false');
  }

  shouldShowBanner(): boolean {
    return localStorage.getItem(this.consentKey) === null;
  }
}
