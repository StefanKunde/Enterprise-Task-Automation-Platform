import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';

interface SubscriptionPlan {
  model: string;
  label: string;
  description: string;
  costInEuro: number;
  durationInDays: number;
  highlight?: boolean;
  feature: 'SERVICE' | 'ADDON';
  isTrial?: boolean;

  discountedCostInEuro?: number;
  discountPercent?: number;
  promoLabel?: string;
  promoDescription?: string;
  originalCostInEuro?: number;
}

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pricing.component.html',
  styleUrls: ['./pricing.component.css'],
})
export class PricingComponent implements OnInit, AfterViewInit {
  @ViewChild('planScroller') planScroller?: ElementRef<HTMLDivElement>;
  canScrollLeft = false;
  canScrollRight = false;
  subscriptionMessage = '';
  selectedPlan: SubscriptionPlan | null = null;

  discountCode = '';
  discountMessage = '';
  showConfirmation = false;
  showSuccess = false;
  errorMessage = '';
  loading = false;

  plans: SubscriptionPlan[] = [];
  // Trial banner states
  trialPlanData: SubscriptionPlan | null = null; // roher Plan aus /plans
  showTrialBanner = false;                              // steuert Sichtbarkeit (mit Animation)
  trialBannerLoading = true;                            // Skeleton bis beide Calls fertig
  trialEligible = true;                                 // Default: sichtbar, bis /users/me kommt

  autoacceptPlans: SubscriptionPlan[] = [];

  cart: SubscriptionPlan[] = [];

  discordLinked = false;
  discordVerified = false;
  private STORAGE_KEY = 'pricing_oauth_return';
  private CART_KEY = 'pricing_cart';

  // ---- Loader state (nur für Plan-Cards) ----
  loadingPlans = true;
  realVisible = false;                // nur Cards
  private loadStartedAt = 0;
  private readonly MIN_SKELETON_MS = 500; // min skeleton duration
  private readonly FADE_MS = 250;         // fade duration

  // sync flags
  private plansLoaded = false;
  private meLoaded = false;

  constructor(
    private http: HttpClient,
    public router: Router,
    private auth: AuthService,
    private route: ActivatedRoute,
  ) {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as { message?: string };
    if (state?.message) this.subscriptionMessage = state.message;
  }

  ngOnInit(): void {
    this.loadStartedAt = performance.now();

    // ---- 1) PUBLIC: /subscriptions/plans ----
    this.http
      .get<SubscriptionPlan[]>(
        `${environment.apiBaseUrl}/subscriptions/plans`,
        { withCredentials: false }
      )
      .subscribe({
        next: (res) => {
          const services = res.filter(p => p.feature === 'SERVICE');
          this.trialPlanData = services.find(p => p.isTrial) || null;
          this.plans      = services.filter(p => !p.isTrial);
          this.autoacceptPlans = [];

          // Crossfade für Cards
          const elapsed = performance.now() - this.loadStartedAt;
          const wait = Math.max(0, this.MIN_SKELETON_MS - elapsed);
          setTimeout(() => {
            this.realVisible = true;              // Cards einblenden
            setTimeout(() => {
              this.loadingPlans = false;          // Skeleton-Cards entfernen
              setTimeout(() => this.updateScrollArrows(), 0);
            }, this.FADE_MS);
          }, wait);

          this.plansLoaded = true;
          this.settleTrialBanner();                // evtl. Trial-Banner zeigen (wenn me schon da)
          // ---- danach: /users/me (optional) ----
          this.loadMe();
        },
        error: (err) => {
          console.error('Failed to load plans', err);
          // trotzdem sauber beenden
          const elapsed = performance.now() - this.loadStartedAt;
          const wait = Math.max(0, this.MIN_SKELETON_MS - elapsed);
          setTimeout(() => {
            this.realVisible = true;
            setTimeout(() => (this.loadingPlans = false), this.FADE_MS);
          }, wait);
          this.plansLoaded = true;
          this.settleTrialBanner();
        },
      });

    // ---- OAuth-Return ----
    this.route.queryParamMap.subscribe(params => {
      const ok  = params.get('discord');
      const err = params.get('err');

      if (ok === 'ok') {
        this.subscriptionMessage = 'Discord connected and server joined — you can activate the trial now.';
        this.discordLinked = true;
        this.discordVerified = true;
      } else if (ok === 'linked') {
        this.subscriptionMessage = 'Discord connected — please join the server to unlock the trial.';
        this.discordLinked = true;
      } else if (err === 'discord_oauth_failed') {
        this.errorMessage = 'Discord login failed. Please try again.';
      } else if (err === 'discord_me_failed') {
        this.errorMessage = 'Could not fetch your Discord profile. Please try again.';
      } else if (err === 'discord_callback_failed') {
        this.errorMessage = 'Discord connection failed. Please try again.';
      }

      // Flags aktualisieren
      this.loadMe();

      const shouldReopen = this.restoreUiStateAfterOAuth();
      if (shouldReopen) this.showConfirmation = true;

      if (ok || err) {
        this.router.navigate([], { queryParams: {}, replaceUrl: true });
      }
      this.clearOAuthState();
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.updateScrollArrows(), 0);
  }

  // ---- /users/me (optional auth) ----
  private loadMe(): void {
    this.http.get<any>(`${environment.apiBaseUrl}/users/me`, {
      withCredentials: true,
      headers: { 'X-Optional-Auth': '1' }
    }).subscribe({
      next: (me) => {
        const hasActiveService = !!me?.subscriptionPrimary || !!me?.activeSubscription;
        const usedTrial = Array.isArray(me?.subscriptionHistory)
          ? me.subscriptionHistory.some((s: any) => s?.isTrial || s?.model === 'TRIAL_1_DAY')
          : false;

        this.trialEligible = !hasActiveService && !usedTrial;
        this.discordLinked = !!me?.discordId;
        this.discordVerified = !!me?.discordJoinVerifiedAt;

        this.sanitizeCart();
        this.meLoaded = true;
        this.settleTrialBanner();

        setTimeout(() => this.updateScrollArrows(), 0);
      },
      error: () => {
        // bleibt eligible im logged-out Fall
        this.trialEligible = true;
        this.discordLinked = false;
        this.discordVerified = false;

        this.meLoaded = true;
        this.settleTrialBanner();
        setTimeout(() => this.updateScrollArrows(), 0);
      }
    });
  }

  /** Entscheidet, wie der Trial-Banner gerendert wird (Skeleton vs. echt vs. Collapsen) */
  private settleTrialBanner(): void {
    // Skeleton nur bis beide Calls einmal durch sind
    if (!this.plansLoaded || !this.meLoaded) {
      this.trialBannerLoading = true;
      return;
    }
    this.trialBannerLoading = false;

    // Wenn kein Trial-Plan existiert, gar nichts anzeigen
    if (!this.trialPlanData) {
      this.showTrialBanner = false;
      return;
    }

    // Wenn Trial erlaubt -> anzeigen, sonst sanft verstecken
    this.showTrialBanner = this.trialEligible;
    // Hinweis: Das eigentliche Collapsing macht das Template+CSS.
  }

  // ---- Discord Flow ----
  connectDiscord(): void {
    this.http.get(`${environment.apiBaseUrl}/users/me`, { withCredentials: true })
      .subscribe({
        next: () => {
          this.saveUiStateBeforeOAuth();
          this.http.get<{ url: string }>(`${environment.apiBaseUrl}/auth/discord/login-url`, { withCredentials: true })
            .subscribe({
              next: (r) => {
                if (r?.url) window.location.href = r.url;
                else this.errorMessage = 'Failed to start Discord login.';
              },
              error: () => this.errorMessage = 'Failed to start Discord login.',
            });
        },
        error: () => this.router.navigate(['/auth/login'], { queryParams: { next: '/pricing' } }),
      });
  }

  verifyDiscordJoin(): void {
    this.http.post(`${environment.apiBaseUrl}/discord/verify-join`, {}, { withCredentials: true })
      .subscribe({
        next: (r: any) => {
          if (r?.ok) {
            this.discordVerified = true;
            this.subscriptionMessage = 'Discord verified — you can activate the trial.';
            this.errorMessage = '';
          } else {
            this.errorMessage = r?.reason === 'NOT_IN_GUILD'
              ? 'Please join our Discord first, then click Verify.'
              : 'Please connect your Discord account first.';
          }
        },
        error: () => this.errorMessage = 'Verification failed. Try again.',
      });
  }

  // ---- Layout Helpers ----
  @HostListener('window:resize')
  onResize() {
    this.updateScrollArrows();
  }

  scrollPlans(dir: -1 | 1): void {
    const el = this.planScroller?.nativeElement;
    if (!el) return;
    const page = el.clientWidth * 0.9;
    el.scrollBy({ left: dir * page, behavior: 'smooth' });
    setTimeout(() => this.updateScrollArrows(), 350);
  }

  updateScrollArrows(): void {
    const el = this.planScroller?.nativeElement;
    if (!el) { this.canScrollLeft = this.canScrollRight = false; return; }
    const maxScrollLeft = el.scrollWidth - el.clientWidth;
    this.canScrollLeft = el.scrollLeft > 1;
    this.canScrollRight = el.scrollLeft < (maxScrollLeft - 1);
  }

  // ---- Cart helpers ---------------------------------------------------------

  toggleCart(plan: SubscriptionPlan): void {
    if (this.isInCart(plan)) {
      this.cart = this.cart.filter(p => !(p.feature === plan.feature && p.model === plan.model));
      if (this.selectedPlan?.model === plan.model) this.selectedPlan = null;
      return;
    }

    if (plan.isTrial) {
      this.cart = [plan];
      this.selectedPlan = plan;
      this.errorMessage = '';
      return;
    }

    if (this.hasTrialInCart()) {
      this.errorMessage = 'The Free Trial cannot be combined with other plans.';
      return;
    }

    if (plan.feature === 'SERVICE') {
      const hadService = this.cart.some(p => p.feature === 'SERVICE');
      if (hadService) this.cart = this.cart.filter(p => p.feature !== 'SERVICE');
    }

    this.cart = [...this.cart, plan];
    this.selectedPlan = plan;
    this.errorMessage = '';
  }

  removeFromCart(idx: number): void {
    const removed = this.cart[idx];
    this.cart.splice(idx, 1);
    if (this.selectedPlan && removed && this.selectedPlan.model === removed.model && this.selectedPlan.feature === removed.feature) {
      this.selectedPlan = null;
    }
    this.cart = [...this.cart];
  }

  get cartTotal(): number {
    return this.cart.reduce((sum, p) => sum + this.priceOf(p), 0);
  }

  selectPlan(plan: SubscriptionPlan): void {
    this.toggleCart(plan);
    this.errorMessage = '';
  }

  applyDiscountCode(): void {
    this.discountMessage = this.discountCode ? `Applied: ${this.discountCode}` : '';
  }

  handleCheckoutClick(): void {
    this.http.get(`${environment.apiBaseUrl}/users/me`, { withCredentials: true }).subscribe({
      next: () => {
        this.showConfirmation = true;
        this.errorMessage = '';

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
          reopenConfirm: true,
          ts: Date.now(),
        }));

        if (!this.hasTrialInCart()) {
          this.router.navigate(['/checkout'], { state: { cart: this.cart } });
        }
      },
      error: () => this.router.navigate(['/auth/login']),
    });
  }

  async confirmPurchase(): Promise<void> {
    if (this.cart.length === 0) return;

    if (this.hasTrialInCart() && !this.discordVerified) {
      this.errorMessage = 'Please connect Discord and join the server to unlock the trial.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.showSuccess = false;

    try {
      for (const item of this.cart) {
        await this.http
          .post(
            `${environment.apiBaseUrl}/subscriptions/trial`,
            { model: item.model, feature: item.feature },
            { withCredentials: true }
          )
          .toPromise();
      }

      this.loading = false;
      this.showConfirmation = true;
      this.subscriptionMessage = `Subscription${this.cart.length > 1 ? 's' : ''} successfully activated.`;
      this.errorMessage = '';
      this.showSuccess = true;
      this.auth.triggerUserRefresh();
      this.cart = [];
      this.selectedPlan = null;
    } catch (err: any) {
      this.loading = false;

      const backendMsg =
        err?.error?.error?.message ||
        err?.error?.message ||
        err?.message;

      if (typeof backendMsg === 'string' && backendMsg.trim()) {
        this.errorMessage = backendMsg;
      } else {
        this.errorMessage = 'Something went wrong. Please try again later.';
      }
    }
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  goToDeposit(): void {
    this.router.navigate(['/deposit']);
  }

  priceOf(p: SubscriptionPlan): number {
    return (typeof p.discountedCostInEuro === 'number') ? p.discountedCostInEuro : p.costInEuro;
  }

  hasTrialInCart(): boolean {
    return this.cart.some(p => !!p.isTrial);
  }

  isInCart(plan: SubscriptionPlan): boolean {
    return this.cart.some(p => p.feature === plan.feature && p.model === plan.model);
  }

  private saveUiStateBeforeOAuth() {
    localStorage.setItem(this.CART_KEY, JSON.stringify(this.cart));
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
      reopenConfirm: this.hasTrialInCart(),
      ts: Date.now(),
    }));
  }

  private restoreUiStateAfterOAuth(): boolean {
    const rawState = localStorage.getItem(this.STORAGE_KEY);
    if (!rawState) return false;

    const rawCart = localStorage.getItem(this.CART_KEY);
    if (rawCart) {
      try {
        const parsed = JSON.parse(rawCart);
        this.cart = Array.isArray(parsed) ? parsed : [];
      } catch {
        this.cart = [];
      }
    }

    let reopen = false;
    try {
      const data = JSON.parse(rawState) as { reopenConfirm?: boolean; ts?: number };
      if (!data.ts || (Date.now() - data.ts) <= 15 * 60_000) {
        reopen = !!data.reopenConfirm;
      }
    } catch {}

    this.sanitizeCart();
    return reopen;
  }

  private clearOAuthState() {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.CART_KEY);
  }

  private sanitizeCart() {
    if (!this.trialEligible) {
      this.cart = this.cart.filter(p => !p.isTrial);
    }

    let serviceSeen = false;
    this.cart = this.cart.filter(p => {
      if (p.feature !== 'SERVICE') return true;
      if (serviceSeen) return false;
      serviceSeen = true;
      return true;
    });
  }

  // trackBy to avoid flicker
  trackPlan = (_: number, p: SubscriptionPlan) => `${p.feature}:${p.model}`;
}
