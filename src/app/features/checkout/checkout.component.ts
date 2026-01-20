import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

type CartItem = {
  model: string;
  feature: 'PREMIUM' | 'ADVANCED';
  label: string;
  costInEuro: number;
  durationInDays: number;

  // NEW (come from pricing page / backend plans DTO)
  discountedCostInEuro?: number;
  discountPercent?: number;
  promoLabel?: string;
  originalCostInEuro?: number;
};

@Component({
  standalone: true,
  selector: 'app-checkout',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './checkout.component.html',
})
export class CheckoutComponent {
  cart: CartItem[] = (history.state?.cart as CartItem[]) || [];
  tosAccepted = false;

  // UI state
  loadingCurrency: null | 'btc'|'eth'|'ltc'|'sol'|'usdterc20'|'usdttrc20' = null;
  phase: 'idle' | 'creating-order' | 'creating-payment' = 'idle';

  orderId: string | null = null;
  error = '';

  currencies = [
    { key: 'btc', label: 'Bitcoin (BTC)' },
    { key: 'eth', label: 'Ethereum (ETH)' },
    { key: 'usdterc20', label: 'USDT (ERC-20)' },
    { key: 'usdttrc20', label: 'USDT (TRC-20)' },
    { key: 'ltc', label: 'Litecoin (LTC)' },
    { key: 'sol', label: 'Solana (SOL)' },
  ] as const;

  /** Prefer discounted price when present */
  priceOf(i: CartItem): number {
    return typeof i.discountedCostInEuro === 'number' ? i.discountedCostInEuro : i.costInEuro;
  }

  get total() { return this.cart.reduce((s, i) => s + this.priceOf(i), 0); }

  constructor(private http: HttpClient, private router: Router) {}

  async select(payCurrency: 'btc'|'eth'|'ltc'|'sol'|'usdterc20'|'usdttrc20') {
    if (!this.tosAccepted) { this.error = 'Please accept the Terms of Service.'; return; }
    if (!this.cart.length) { this.error = 'Your cart is empty.'; return; }
    if (this.loadingCurrency) return;

    this.error = '';
    this.loadingCurrency = payCurrency;

    try {
      if (!this.orderId) {
        this.phase = 'creating-order';
        const resp = await firstValueFrom(
          this.http.post<{ orderId: string }>(
            `${environment.apiBaseUrl}/orders`,
            // Send minimal data; backend re-calculates prices securely
            { cart: this.cart.map(i => ({ model: i.model, feature: i.feature })) },
            { withCredentials: true }
          )
        );
        this.orderId = resp.orderId;
      }

      this.phase = 'creating-payment';
      const pay = await firstValueFrom(
        this.http.post<{ paymentId: string } & Record<string, any>>(
          `${environment.apiBaseUrl}/payments/now/create`,
          { orderId: this.orderId, payCurrency },
          { withCredentials: true }
        )
      );

      this.router.navigate(['/checkout/pay', pay.paymentId], { state: { pay, orderId: this.orderId } });
    } catch {
      this.error = 'Could not start the payment. Please try again.';
      this.phase = 'idle';
      this.loadingCurrency = null;
    }
  }
}
