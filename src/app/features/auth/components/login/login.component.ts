import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../auth.service';
import { Router, RouterModule, RouterStateSnapshot } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  error: string | null = null;
  unverifiedEmail: boolean = false;
  resendSuccess = false;
  resendError = false;
  showForgotPassword = false;
  showResetModal = false;
  resetEmail: string = '';
  resetEmailSent = false;
  resetError = false;
  private fb = inject(FormBuilder);
  successMessage: string | null = null;

  constructor(private auth: AuthService, private router: Router, private readonly route: ActivatedRoute) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const message = params['message'];
      if (message === 'merge-success') {
        this.successMessage = 'Accounts successfully merged. Please log in again.';
      }
    });

  }

  submit() {
    if (this.form.invalid) return;

    this.loading = true;
    this.error = null;

    const { email, password } = this.form.value;

    this.auth.login(email, password).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.log('err: ', err);
        const message = err?.error?.error?.message?.toLowerCase() || '';
        console.log('message:' , message);
        if (err?.error?.error?.statusCode === 403 && message.includes('not been verified')) {
          this.unverifiedEmail = true;
          this.error = 'Please confirm your email address.';
        } else {
          this.error = 'Login failed';
        }
        this.loading = false;
      }

    });
  }

  resendVerification() {
    this.auth.resendVerificationEmail(this.form.value.email).subscribe({
      next: () => {
        this.resendSuccess = true;
        this.resendError = false;
      },
      error: () => {
        this.resendError = true;
        this.resendSuccess = false;
      },
    });
  }

  openResetModal() {
    this.showResetModal = true;
    this.resetEmailSent = false;
    this.resetError = false;
    this.resetEmail = this.form.value.email || '';
  }

  closeResetModal() {
    this.showResetModal = false;
  }

  requestPasswordReset() {
    this.resetEmailSent = false;
    this.resetError = false;

    this.auth.requestPasswordReset(this.resetEmail).subscribe({
      next: () => {
        this.resetEmailSent = true;
      },
      error: () => {
        this.resetError = true;
      }
    });
  }


}

