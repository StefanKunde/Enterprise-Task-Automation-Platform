// src/app/checkout/payment/payment.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { QRCodeComponent } from 'angularx-qrcode';
import { FormsModule } from '@angular/forms';

// ✅ EIP-55 checksum for ETH & ERC-20 addresses
import { getAddress as toChecksumAddress } from 'ethers';

type PayCurrency = 'btc'|'eth'|'ltc'|'sol'|'usdterc20'|'usdttrc20';

type PayData = {
  paymentId: number|string;
  orderId: string;
  payCurrency: PayCurrency;
  payAddress?: string;
  payAmount?: number;     // amount in native coin (BTC/LTC/ETH/SOL). For USDT it's token units.
  priceAmount?: number;   // fiat
  priceCurrency?: string;
  createdAt?: string;
  expiresAt?: string;
};

@Component({
  standalone: true,
  selector: 'app-payment',
  imports: [CommonModule, RouterModule, QRCodeComponent, FormsModule],
  templateUrl: './payment.component.html',
})
export class PaymentComponent implements OnInit, OnDestroy {
String(arg0: number|undefined): string|undefined {
throw new Error('Method not implemented.');
}
  paymentId!: string;
  data: PayData | null = null;
  remaining = 0;
  skew = 0;

  // ✅ Default to raw-address QR for all coins (best compatibility)
  useSimpleQR = true;

  pollTimer: any;
  expiryTimer: any;

  constructor(private ar: ActivatedRoute, private http: HttpClient, private router: Router) {}

  async ngOnInit() {
    this.paymentId = this.ar.snapshot.paramMap.get('paymentId')!;

    const state = history.state?.pay;
    const orderId = history.state?.orderId;
    if (state && orderId) {
      this.data = {
        paymentId: this.paymentId,
        orderId,
        payCurrency: state.payCurrency,
        payAddress: state.payAddress,
        payAmount: state.payAmount,
        priceAmount: state.priceAmount,
        priceCurrency: state.priceCurrency,
        createdAt: state.createdAt,
        expiresAt: state.expiresAt,
      };
    }

    if (!this.data) await this.hydrateFromBackend();

    this.startExpiryCountdown();
    this.startPolling();
  }

  ngOnDestroy() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.expiryTimer) clearInterval(this.expiryTimer);
  }

  get minutesLeft(): number {
    const totalSeconds = Math.floor(this.remaining / 1000);
    return Math.max(0, Math.floor((totalSeconds % 3600) / 60));
  }
  get secondsLeft(): number {
    const totalSeconds = Math.floor(this.remaining / 1000);
    return Math.max(0, totalSeconds % 60);
  }

  private async hydrateFromBackend() {
    const s: any = await this.http.get(
      `${environment.apiBaseUrl}/payments/now/status/${this.paymentId}`,
      { withCredentials: true }
    ).toPromise();

    if (s?.error) { this.router.navigate(['/checkout/failed']); return; }
    if (s?.serverTime) this.skew = new Date(s.serverTime).getTime() - Date.now();

    this.data = {
      paymentId: this.paymentId,
      orderId: s.orderId,
      payCurrency: s.payCurrency,
      payAddress: s.payAddress,
      payAmount: s.payAmount,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
    };
  }

  private startExpiryCountdown() {
    const exp = new Date(this.data?.expiresAt || Date.now() + 20*60*1000).getTime();
    const tick = () => { this.remaining = Math.max(0, exp - (Date.now() + this.skew)); };
    tick();
    this.expiryTimer = setInterval(tick, 1000);
  }

  private startPolling() {
    this.pollTimer = setInterval(async () => {
      try {
        const s: any = await this.http.get(
          `${environment.apiBaseUrl}/payments/now/status/${this.paymentId}`,
          { withCredentials: true }
        ).toPromise();

        if (s?.serverTime) this.skew = new Date(s.serverTime).getTime() - Date.now();

        if (this.data && (s?.payAddress || s?.payAmount)) {
          this.data.payAddress = s.payAddress ?? this.data.payAddress;
          this.data.payAmount  = s.payAmount  ?? this.data.payAmount;
        }
        if (s?.expiresAt && this.data) this.data.expiresAt = s.expiresAt;

        if (s?.status === 'finished') {
          clearInterval(this.pollTimer); clearInterval(this.expiryTimer);
          this.router.navigate(['/checkout/success'], { queryParams: { order: s.orderId }});
        } else if (['failed','expired'].includes(s?.status)) {
          clearInterval(this.pollTimer); clearInterval(this.expiryTimer);
          this.router.navigate(['/checkout/failed'], { queryParams: { order: s.orderId }});
        }
      } catch {}
    }, 5000);
  }

  // ---------- Helpers ----------

  // Normalize address per currency for QR and display
  normalizeAddress(addr?: string, currency?: PayCurrency): string {
    const a = (addr || '').trim();
    const c = (currency || '').toLowerCase() as PayCurrency;
    if (!a) return '';

    switch (c) {
      case 'eth':
      case 'usdterc20': { // ERC-20 on Ethereum must be EIP-55 checksummed for some scanners
        if (/^0x[0-9a-fA-F]{40}$/.test(a)) {
          try { return toChecksumAddress(a); } catch { return a; }
        }
        return a;
      }
      case 'usdttrc20': // TRON base58, starts with T
        return a; // no transform; just ensure no whitespace
      case 'btc':
      case 'ltc':
      case 'sol':
      default:
        return a; // BTC/LTC/SOL don’t need case transforms
    }
  }

  // Format BTC/LTC amounts (8 dp typical)
  private formatCoin8(n: number | string | undefined | null): string | null {
    if (n === undefined || n === null) return null;
    const x = Number(n);
    if (!isFinite(x)) return null;
    return x.toFixed(8).replace(/\.?0+$/,'');
  }

  // Decimal -> wei string (ETH/ERC20)
  private toWeiStr(amount: number | string): string {
    const s = String(amount);
    const [intPart, fracPartRaw = ''] = s.split('.');
    const frac = (fracPartRaw + '0'.repeat(18)).slice(0, 18);
    const intClean = intPart.replace(/^0+(?=\d)/, '');
    const res = (intClean || '0') + frac;
    return res.replace(/^0+/, '') || '0';
  }

  // Network hint for the UI
  networkHint(currency?: PayCurrency): string {
    switch ((currency || '').toLowerCase()) {
      case 'usdterc20': return 'Network: Ethereum (USDT ERC-20)';
      case 'usdttrc20': return 'Network: TRON (USDT TRC-20)';
      case 'eth':       return 'Network: Ethereum';
      case 'btc':       return 'Network: Bitcoin';
      case 'ltc':       return 'Network: Litecoin';
      case 'sol':       return 'Network: Solana';
      default:          return '';
    }
  }

  // The QR payload
  encodeUri(): string {
    const cur  = (this.data?.payCurrency || '').toLowerCase() as PayCurrency;
    const addr = this.normalizeAddress(this.data?.payAddress, cur);
    const amt  = this.data?.payAmount;

    if (!addr) return '';

    // ✅ Default: raw address only (best support across exchange scanners)
    if (this.useSimpleQR) return addr;

    // Optional “deeplink” formats
    switch (cur) {
      case 'btc': {
        const amountStr = this.formatCoin8(amt);
        const params = new URLSearchParams();
        if (amountStr) params.set('amount', amountStr);
        const qs = params.toString();
        return qs ? `bitcoin:${addr}?${qs}` : `bitcoin:${addr}`;
      }
      case 'ltc': {
        const amountStr = this.formatCoin8(amt);
        const params = new URLSearchParams();
        if (amountStr) params.set('amount', amountStr);
        const qs = params.toString();
        return qs ? `litecoin:${addr}?${qs}` : `litecoin:${addr}`;
      }
      case 'eth': {
        // EIP-681: value in WEI (not supported by all exchange scanners)
        if (amt !== undefined && amt !== null) {
          const wei = this.toWeiStr(amt);
          return `ethereum:${addr}?value=${wei}`;
        }
        return `ethereum:${addr}`;
      }
      case 'sol': {
        // Solana Pay basic: amount in SOL (decimal)
        const params = new URLSearchParams();
        if (amt !== undefined && amt !== null) params.set('amount', String(amt));
        const qs = params.toString();
        return qs ? `solana:${addr}?${qs}` : `solana:${addr}`;
      }
      case 'usdterc20':
      case 'usdttrc20': {
        // No universal deeplink; most scanners prefer raw address.
        return addr;
      }
      default:
        return addr;
    }
  }

  toStr(val: any): string {
    return val != null ? String(val) : '';
  }


  copy(txt?: string) { if (txt) navigator.clipboard.writeText(txt).catch(()=>{}); }
}
