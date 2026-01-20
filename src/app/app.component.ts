import { Component, HostListener, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { AuthService } from './features/auth/auth.service';
import { FooterComponent } from './shared/layout/footer/footer.component';
import { NavbarComponent } from './shared/layout/navbar/navbar.component';
import { CookieConsentComponent } from './shared/layout/cookie-consent/cookie-consent.component';
import { CommonModule } from '@angular/common';
import { GundalfHintComponent } from './shared/gundalf-hint/gundalf-hint.component';
import { MaintenanceService } from './core/services/maintenance.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, NavbarComponent, FooterComponent, CookieConsentComponent, GundalfHintComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'RollDigger';
  private lastScrollTop = 0;
  hideNavbar = false;

  constructor(
    private authService: AuthService,
    private maintenanceService: MaintenanceService
  ) {}

  ngOnInit(): void {
    // Check maintenance status on app initialization
    this.maintenanceService.checkMaintenanceStatus();
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const currentScroll = window.scrollY || document.documentElement.scrollTop;

    if (window.innerWidth >= 768) {
      this.hideNavbar = currentScroll > this.lastScrollTop && currentScroll > 50;
    } else {
      this.hideNavbar = false;
    }

    this.lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
  }

  private shuffle(arr: number[]): number[] {
    return [...arr].sort(() => Math.random() - 0.5);
  }
}
