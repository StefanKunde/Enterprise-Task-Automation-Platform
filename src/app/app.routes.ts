import { Routes } from '@angular/router';
import { LandingComponent } from './features/landing/landing.component';
import { PricingComponent } from './features/pricing/pricing.component';
import { FaqComponent } from './features/faq/faq.component';
import { TermsComponent } from './features/terms/terms.component';
import { PrivacyComponent } from './features/privacy/privacy.component';
import { AuthGuard } from './features/auth/auth.guard';
import { SubscriptionGuard } from './core/guards/subscription.guard';
import { EmailVerifiedSuccessComponent } from './features/auth/components/email-verified-success/email-verified-success.component';
import { EmailVerifiedFailedComponent } from './features/auth/components/email-verified-failed/email-verified-failed.component';
import { ChangePasswordComponent } from './features/auth/components/change-password/change-password.component';
import { ResetPasswordComponent } from './features/auth/components/reset-password/reset-password.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'pricing', component: PricingComponent },
  { path: 'faq', component: FaqComponent },
  { path: 'terms-of-service', component: TermsComponent },
  { path: 'privacy', component: PrivacyComponent },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then((m) => m.AuthModule),
  },
  {
    path: 'auth/email-verified',
    component: EmailVerifiedSuccessComponent,
  },
  {
    path: 'auth/invalid-verification',
    component: EmailVerifiedFailedComponent,
  },
  { path: 'auth/reset-password', component: ResetPasswordComponent },
  { path: 'profile/change-password', component: ChangePasswordComponent },
  {
    path: 'dashboard',
    canActivate: [AuthGuard, SubscriptionGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'subscription',
    loadComponent: () => import('./features/subscription/subscription.component').then(m => m.SubscriptionComponent)
  },
  {
    path: 'checkout',
    loadComponent: () => import('./features/checkout/checkout.component').then(m => m.CheckoutComponent)
  },
  {
    path: 'checkout/pay/:paymentId',
    loadComponent: () => import('./features/checkout/payment/payment.component').then(m => m.PaymentComponent)
  },
  {
    path: 'checkout/success',
    loadComponent: () => import('./features/checkout/success/success.component').then(m => m.SuccessComponent)
  },
  {
    path: 'checkout/failed',
    loadComponent: () => import('./features/checkout/failed/failed.component').then(m => m.FailedComponent)
  },
  { path: '**', redirectTo: 'auth/login' },
];
