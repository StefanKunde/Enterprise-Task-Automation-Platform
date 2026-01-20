import { Component } from '@angular/core';
import { CookieConsentService } from './cookie-consent.service';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-cookie-consent',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cookie-consent.component.html',
  styleUrls: ['./cookie-consent.component.css'],
  animations: [
    trigger('fadeOut', [
      transition(':leave', [
        animate('300ms ease', style({ opacity: 0, transform: 'translateY(20px)' })),
      ]),
    ]),
  ],
})
export class CookieConsentComponent {
  showBanner = true;

  constructor(public cookie: CookieConsentService) {
    const accepted = localStorage.getItem('cookie_consent');
    if (!accepted) {
      this.showBanner = true;
    }
  }

  ngOnInit() {
    this.showBanner = this.cookie.shouldShowBanner();
  }


  accept() {
    this.cookie.setConsent(true);
    this.showBanner = false;
  }

  reject() {
    this.cookie.setConsent(false);
    this.showBanner = false;
  }

  close() {
    this.showBanner = false;
  }
}
