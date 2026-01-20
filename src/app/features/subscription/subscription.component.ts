import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';

type SubKind = 'PREMIUM' | 'ADVANCED';

interface SubscriptionEntry {
  model: SubKind | string;
  constInEuro?: number;
  costInEuro?: number;
  startedAt: string;
  expiresAt: string;
  createdAt: string;
  remainingDays: number;
  isTrial?: boolean;
  remainingSeconds?: number;
}

interface MeResponse {
  subscriptionPrimary?: SubscriptionEntry | null;
  subscriptionAdvanced?: SubscriptionEntry | null;
  subscriptionHistory?: SubscriptionEntry[] | null;
}

type UiSub = {
  label: string;
  plan: string;
  expiresAt: string | null;
  createdAt: string | null;
  startedAt: string | null;
  remainingDays: number | null;
  priceEuro: number | null;
  active: boolean;
  isTrial: boolean;
  remainingSeconds: number | null;
};

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './subscription.component.html',
})
export class SubscriptionComponent implements OnInit {
String(arg0: string): string {
throw new Error('Method not implemented.');
}
  // raw
  primarySubscription: SubscriptionEntry | null = null;
  advancedSubscription: SubscriptionEntry | null = null;
  history: SubscriptionEntry[] = [];

  // ui
  primaryUi: UiSub | null = null;
  advancedUi: UiSub | null = null;
  sortedHistory: SubscriptionEntry[] = [];
  showHistory = false;
  countdownTimer: any;

  // summary
  subsCount = 0;
  nextExpiryDays: number | null = null;

  loading = true;
  error: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http
      .get<MeResponse>(`${environment.apiBaseUrl}/users/me`, { withCredentials: true })
      .subscribe({
        next: (res) => {
          this.primarySubscription = res?.subscriptionPrimary ?? null;
          this.advancedSubscription = res?.subscriptionAdvanced ?? null;
          this.history = res?.subscriptionHistory ?? [];

          this.primaryUi = this.toUi('Premium Plan', this.primarySubscription);
          this.advancedUi = this.toUi('Advanced Plan', this.advancedSubscription);

          this.sortedHistory = [...this.history].sort(
            (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
          );

          this.updateSummary();
          this.loading = false;
          this.error = null;
        },
        error: (err) => {
          console.error('Fehler beim Laden', err);
          this.loading = false;
          this.error = 'Failed to load subscriptions.';
        },
      });

      this.startCountdown();
  }

  ngOnDestroy(): void {
    clearInterval(this.countdownTimer);
  }

  private startCountdown(): void {
    clearInterval(this.countdownTimer);
    this.countdownTimer = setInterval(() => {
      const update = (u: UiSub | null) => {
        if (!u || !u.isTrial || !u.remainingSeconds) return;
        u.remainingSeconds = Math.max(0, u.remainingSeconds - 1);
        // also recompute remainingDays for badges if you want:
        if (u.expiresAt) {
          const t = Date.parse(u.expiresAt) - Date.now();
          u.remainingDays = Math.max(0, Math.ceil(t / 86_400_000));
        }
      };
      update(this.primaryUi);
      update(this.advancedUi);
    }, 1000);
  }

  formatHms(totalSeconds: number | null | undefined): string {
    if (!totalSeconds || totalSeconds <= 0) return '00:00:00';
    const s = Math.floor(totalSeconds);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
    return `${pad(h)}:${pad(m)}:${pad(sec)}`;
  }

  /** Convert raw entry to UI shape */
  private toUi(label: string, s: SubscriptionEntry | null): UiSub | null {
    if (!s) return null;
    const plan = this.formatModel(String(s.model ?? ''));
    const expiresAt = s.expiresAt ?? null;
    const createdAt = s.createdAt ?? null;
    const startedAt = s.startedAt ?? null;
    const days = typeof s.remainingDays === 'number' ? s.remainingDays : null;
    const price = (s.costInEuro ?? s.constInEuro ?? null) as number | null;
    const active = typeof days === 'number' ? days > 0 : (expiresAt ? new Date(expiresAt) > new Date() : false);

    return {
      label,
      plan,
      expiresAt,
      createdAt,
      startedAt,
      remainingDays: days,
      priceEuro: price,
      active,
      isTrial: !!s.isTrial,
      remainingSeconds: typeof s.remainingSeconds === 'number' ? s.remainingSeconds : null,
    };
  }


  private updateSummary() {
    const list = [this.primaryUi, this.advancedUi].filter(Boolean) as UiSub[];
    this.subsCount = list.filter((x) => x.active).length;

    const next = list
      .filter((x) => x.active && typeof x.remainingDays === 'number')
      .map((x) => x.remainingDays as number)
      .sort((a, b) => a - b)[0];

    this.nextExpiryDays = Number.isFinite(next) ? (next as number) : null;
  }

  goToPricing(): void {
    // use routerLink in template for SPA nav; keep this method for any button using (click)
    window.location.href = '/pricing';
  }

  toggleHistory(): void {
    this.showHistory = !this.showHistory;
  }

  formatModel(model: string | null | undefined): string {
    if (!model) return '';
    return model
      .replace('_', ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }


  isFuture(dateStr: string | null | undefined): boolean {
    if (!dateStr) return false;
    return new Date(dateStr) > new Date();
  }
}
