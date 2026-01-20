import { Component, HostListener, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../features/auth/auth.service';
import { environment } from '../../../../environments/environment';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';


@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent implements OnInit {
  isAuthChecked = false;
  isLoggedIn = false;

  @ViewChild('navContainer') navContainer!: ElementRef;
  @ViewChild('avatarRef') avatarRef!: ElementRef;

  mobileMenuOpen = false;
  showUserMenu = false;
  mobileUserMenuOpen = false;
  username: string | null = null;
  avatarUrl: string | null = null;
  hasActiveSubscription: boolean = false;

  underlineStyle = { left: '0px', width: '0px' };
  private lastLock: HTMLElement | null = null;
  lockedElement: HTMLElement | null = null;
  preventRestore = false;

  constructor(
    public auth: AuthService,
    private http: HttpClient,
    public router: Router
  ) {
    this.router.events
    .pipe(filter(event => event instanceof NavigationEnd))
    .subscribe(() => {
      setTimeout(() => this.setUnderlineToActiveLink(), 150);
    });

  }

  ngOnInit(): void {
    this.auth.getAuthCheckDoneObservable().subscribe((done: boolean) => {
      this.isAuthChecked = done;
    });

    this.auth.getLoginStatusObservable().subscribe((loggedIn: boolean) => {
      this.isLoggedIn = loggedIn;

      if (loggedIn) {
        this.loadUserInfo();
      } else {
        this.username = null;
        this.avatarUrl = null;
        this.hasActiveSubscription = false;
      }
    });

    this.auth.getUserRefreshObservable().subscribe( () => {
      this.loadUserInfo();
    });


  }

  private loadUserInfo() {
    this.auth.getLoginStatusObservable().subscribe((isLoggedIn: boolean) => {
      if (isLoggedIn) {
        this.http.get<{ username: string; avatar?: string; subscriptionPrimary?: {expiresAt: Date} }>(
          `${environment.apiBaseUrl}/users/me`,
          { withCredentials: true }
        ).subscribe({
          next: (res) => {
            this.username = res.username;
            this.avatarUrl = res.avatar || null;
            const exp = new Date(res?.subscriptionPrimary?.expiresAt || 0).getTime();
            this.hasActiveSubscription = exp > Date.now();
          },
          error: (err) => console.error('Error loading user data', err),
        });
      } else {
        this.username = null;
        this.avatarUrl = null;
      }
    });
  }

  ngAfterViewInit() {
    // initial nach erstem Render
    setTimeout(() => this.setUnderlineToActiveLink(), 150);

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        // verzögert, damit DOM nach Navigation bereit ist
        setTimeout(() => this.setUnderlineToActiveLink(), 150);
      });
  }





  logout(): void {
    this.auth.logout().subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
    });
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  navigateToProfile() {
    this.router.navigate(['/profile']);
  }

  onAvatarClick(event: MouseEvent) {
    this.toggleUserMenu();
    this.setUnderlineToElement(this.avatarRef.nativeElement);
  }

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;

    // Wenn Menü schließt → zurück zur aktiven Route
    if (!this.showUserMenu) {
      setTimeout(() => {
        const activeLink = this.navContainer.nativeElement.querySelector('a.router-link-active');
        if (activeLink) {
          this.setUnderlineToElement(activeLink as HTMLElement);
        }
      });
    }
  }

  lockUnderline(event: MouseEvent) {
    const target = event.currentTarget as HTMLElement;
    this.lockedElement = target;
    this.moveUnderline(event);
  }

  resetUnderline(clearLock = false) {
    const container = this.navContainer?.nativeElement as HTMLElement;
    if (!container) return;

    if (clearLock) {
      this.lockedElement = null;
      this.underlineStyle = {
        left: '',
        width: '',
      };
      this.preventRestore = true;
      return;
    }

    if (!this.lockedElement) {
      this.underlineStyle = {
        left: '',
        width: '',
      };
      return;
    }

    const { left: containerLeft } = container.getBoundingClientRect();
    const { left, width } = this.lockedElement.getBoundingClientRect();

    this.underlineStyle = {
      left: `${left - containerLeft}px`,
      width: `${width}px`,
    };
  }




  toggleMobileUserMenu(): void {
    this.mobileUserMenuOpen = !this.mobileUserMenuOpen;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;

    // Mobile Menü schließen
    if (
      !target.closest('.mobile-user-avatar') &&
      !target.closest('.mobile-user-menu')
    ) {
      this.mobileUserMenuOpen = false;
    }

    // Desktop Menü schließen
    if (!target.closest('.user-menu-container')) {
      this.showUserMenu = false;
    }
  }

  moveUnderline(event: MouseEvent) {
    const el = event.currentTarget as HTMLElement;
    this.setUnderlineToElement(el);
  }

  private setUnderlineToElement(el: HTMLElement) {
    const container = this.navContainer.nativeElement as HTMLElement;
    const { left: containerLeft } = container.getBoundingClientRect();
    const { left, width } = el.getBoundingClientRect();
    this.underlineStyle = {
      left: `${left - containerLeft}px`,
      width: `${width}px`,
    };
  }

  private setUnderlineToActiveLink() {
    if (this.preventRestore) {
      console.log('[Underline] Überspringe setUnderlineToActiveLink, weil preventRestore true');
      this.preventRestore = false;
      return;
    }

    const container = this.navContainer?.nativeElement;
    if (!container) return;

    const active = container.querySelector('a.router-link-active') as HTMLElement;
    if (active) {
      const { left: containerLeft } = container.getBoundingClientRect();
      const { left, width } = active.getBoundingClientRect();
      this.underlineStyle = {
        left: `${left - containerLeft}px`,
        width: `${width}px`,
      };

      if (!this.lockedElement) {
        this.lockedElement = active;
      }
    }
  }






}
