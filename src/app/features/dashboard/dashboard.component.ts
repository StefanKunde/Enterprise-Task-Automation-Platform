import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-[#141C22] text-white min-h-screen px-6 py-12">
      <div class="max-w-4xl mx-auto">
        <!-- Demo Notice -->
        <div class="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-4 mb-8 text-center">
          <p class="text-yellow-200 font-semibold">⚠️ Portfolio Demo Only</p>
          <p class="text-yellow-300/80 text-sm mt-1">This is a protected route demonstration. No functional dashboard.</p>
        </div>

        <!-- Main Content -->
        <div class="text-center space-y-6">
          <h1 class="text-4xl font-bold text-white">Protected Dashboard</h1>
          <p class="text-[#B6C2CF] text-lg">
            This page demonstrates route guard protection and authentication state management.
          </p>

          <div class="bg-[#20272E] rounded-xl p-8 mt-8">
            <h2 class="text-2xl font-semibold mb-4 text-[#3DB34A]">✓ Authentication Verified</h2>
            <p class="text-[#B6C2CF]">
              You've successfully accessed a protected route that requires authentication.
            </p>
          </div>

          <div class="mt-8 space-y-4">
            <div class="bg-[#20272E] rounded-lg p-6 text-left">
              <h3 class="text-xl font-semibold mb-2 text-white">Technical Features Demonstrated:</h3>
              <ul class="list-disc list-inside text-[#B6C2CF] space-y-2">
                <li>Route Guards (AuthGuard, SubscriptionGuard)</li>
                <li>JWT Token-based Authentication</li>
                <li>Protected Route Access Control</li>
                <li>Session State Management</li>
                <li>Secure Navigation Redirection</li>
              </ul>
            </div>
          </div>

          <button
            (click)="logout()"
            class="mt-8 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-8 rounded-xl transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class DashboardComponent {
  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  logout(): void {
    this.auth.logout().subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
    });
  }
}
