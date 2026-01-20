import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  email: string = '';
  hasPassword: boolean = false;

  // Password change
  showChangePassword = false;
  newPassword: string = '';
  confirmNewPassword: string | null = '';
  currentPassword: string = '';
  passwordChangeSuccess = false;
  passwordChangeError: string | null = null;
  passwordValidationError: string = '';
  passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;

  // Subscriptions summary
  subscriptionPrimary: { model: string } | null = null;
  subscriptionAdvanced: { model: string } | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadUserData();
  }

  loadUserData() {
    this.http.get<{
      email: string;
      hasPassword: boolean;
      subscriptionPrimary?: { model: string };
      subscriptionAdvanced?: { model: string };
    }>(`${environment.apiBaseUrl}/users/me`, { withCredentials: true })
    .subscribe({
      next: (res) => {
        this.email = res.email || '';
        this.hasPassword = res.hasPassword;

        this.subscriptionPrimary = res.subscriptionPrimary ?? null;
        this.subscriptionAdvanced = res.subscriptionAdvanced ?? null;
      },
      error: (err) => {
        console.error('Fehler beim Laden des Profils:', err);
      }
    });
  }

  navigateToSubscription() {
    this.router.navigate(['/pricing']);
  }

  submitPasswordChange(changePwForm: NgForm) {
    this.passwordValidationError = '';
    this.passwordChangeSuccess = false;
    this.passwordChangeError = '';

    if (!this.passwordRegex.test(this.newPassword)) {
      this.passwordValidationError = 'Password must contain at least one letter and one number.';
      return;
    }

    if (this.newPassword !== this.confirmNewPassword) {
      this.passwordValidationError = 'Passwords do not match.';
      return;
    }

    this.http.post(`${environment.apiBaseUrl}/auth/change-password`, {
      currentPassword: this.currentPassword,
      newPassword: this.newPassword,
      confirmNewPassword: this.confirmNewPassword
    }, { withCredentials: true }).subscribe({
      next: () => {
        this.passwordChangeSuccess = true;
        this.passwordChangeError = '';
        this.passwordValidationError = '';

        // Reset values & form
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmNewPassword = '';
        changePwForm.resetForm();
      },
      error: (err) => {
        console.error('Password change failed:', err);
        this.passwordChangeError = err?.error?.message || 'Failed to change password.';
      }
    });
  }

  newPasswordValid(): boolean {
    return this.passwordRegex.test(this.newPassword);
  }
}
