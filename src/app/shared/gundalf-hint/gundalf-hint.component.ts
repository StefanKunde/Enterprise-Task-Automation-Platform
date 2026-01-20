import {
  Component,
  Input,
  OnInit,
  HostListener,
  ElementRef,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CookieConsentService } from '../layout/cookie-consent/cookie-consent.service';

@Component({
  selector: 'app-gundalf-hint',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gundalf-hint.component.html',
  styleUrls: ['./gundalf-hint.component.css']
})
export class GundalfHintComponent implements AfterViewInit  {
  @Input() message = '💡 TaskFlow optimizes your workflow!';
  position: 'left' | 'right' = 'left';
  showText = false;
  isVisible = false;
  isFlyingOut = false;
  hoverActive = false;
  private messages = [
    '💡 Smart automation starts with proper task filtering!',
    '🧠 Intelligent workflows use filters. Be efficient.',
    '⚙️ Task execution engine running smoothly!',
    '💸 Check your subscription for premium features!',
    '📦 Automated processing is working perfectly.',
    '🔐 Keep your workflow organized – filters are essential.',
    '🧙 TaskFlow approved your automation rules!',
    '🥷 Optimizing workflows since the Third Age.',
    '🔥 High-priority tasks deserve attention.',
    '📱 Process tasks faster than manual execution.',
    '🐉 Complex workflows bring power – use them wisely.',
    '🎯 Configure wisely… results will follow.',
    '🧙 "Even the smallest task can change productivity."',
    '🔮 TaskFlow predicted this optimization!',
    '🌌 Magic? No. Just smart automation.',
    '🪄 A wise developer configures before deploying.',
    '🧭 Follow the green – always the green glow of success.',
    '🎰 One click away from peak efficiency!',
    '⏳ Time is valuable. Automation saves it.',
    '💡 Premium subscribers get instant notifications!',
    '💸 One optimized workflow pays for itself.',
    '⚙️ Advanced features: 24/7 availability, instant alerts.',
    '🔔 Get notified the moment tasks complete.',
    '🪄 Automation powered by smart configuration.',
    '🧙 Filter out unnecessary tasks – focus on value.',
    '🎯 Remove noise from your workflow. Peace restored.',
    '🛑 No more manual repetition – automation handles it.',
    '🎒 Your dashboard deserves clean organization!',
    '📦 Unnecessary complexity? Filter it out.',
    '🧠 Smart users leverage automation. Be smart.',
    '🧙 With advanced filters, control every detail.',
    '🔍 Fine-tune exactly what gets processed.',
    '🪄 Advanced filtering = total control.',
    '⏱️ Speed and precision beat manual work.',
    '💸 Efficiency compounds over time.',
    '📊 Small optimizations add up to big wins.',
  ];

  positionStyle: { [key: string]: any } = {
    position: 'fixed',
    bottom: '3rem'
  };

  private timeoutHandle: any;

  constructor(
    private el: ElementRef,
    private cookieConsent: CookieConsentService
  ) {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.showGundalfHintCycle(); // Start nach 3.5s
    }, 3500);
  }

  startTimeout() {
    this.timeoutHandle = setTimeout(() => {
      if (!this.hoverActive) {
        this.showText = false;
        this.isFlyingOut = true;
        setTimeout(() => {
          this.isVisible = false;

          // ⏱️ Wieder anzeigen nach  Minute
          setTimeout(() => {
            this.showGundalfHintCycle();
          }, 1 * 60 * 1000); //  Minute

        }, 1000);
      } else {
        this.startTimeout();
      }
    }, 8000);
  }


  onHoverStart() {
    this.hoverActive = true;
    clearTimeout(this.timeoutHandle);
  }

  onHoverEnd() {
    this.hoverActive = false;
    this.startTimeout();
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.updatePosition();
  }

  private updatePosition() {
    const footer = document.getElementById('page-footer');
    if (!footer) return;

    const footerRect = footer.getBoundingClientRect();
    const overlap = window.innerHeight - footerRect.top;

    if (overlap > 0) {
      // Wenn Gundalf über dem Footer wäre, dann hebe ihn entsprechend an
      this.positionStyle = {
        position: 'fixed',
        bottom: `${3 + overlap}px`, // 3rem + angehobene Differenz
        transform: `translateY(-${overlap}px)`
      };
    } else {
      this.positionStyle = {
        position: 'fixed',
        bottom: '3rem',
        transform: 'translateY(0)'
      };
    }
  }

  @HostListener('window:resize', [])
  onResize() {
    this.updatePosition(); // bei Window-Resize erneut prüfen
  }


  private showGundalfHintCycle() {
    if (!this.cookieConsent.hasConsented() && this.cookieConsent.shouldShowBanner()) {
      this.position = 'right';
    } else {
      this.position = Math.random() > 0.5 ? 'right' : 'left';
    }

    this.message = this.messages[Math.floor(Math.random() * this.messages.length)];
    this.isFlyingOut = false;
    this.showText = false;
    this.isVisible = true;

    setTimeout(() => (this.showText = true), 500);
    this.startTimeout();

    let tries = 0;
    const interval = setInterval(() => {
      this.updatePosition();
      tries++;
      if (tries > 20) clearInterval(interval);
    }, 100);
  }


}
