import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
})
export class ResetPasswordComponent implements OnInit {
  form!: FormGroup;
  token: string = '';
  success = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';

    if (!this.token) {
      this.error = 'Invalid or missing reset token.';
      return;
    }

    this.form = this.fb.group({
      newPassword: [
        '',
        [
          Validators.required,
          Validators.minLength(6),
          Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).{6,}$/),
        ],
      ],
      confirmPassword: ['', Validators.required],
    });
  }

  submit() {
    if (this.form.invalid) return;

    const { newPassword, confirmPassword } = this.form.value;
    if (newPassword !== confirmPassword) {
      this.error = 'Passwords do not match.';
      return;
    }

    this.http
      .post(`${environment.apiBaseUrl}/auth/reset-password`, {
        token: this.token,
        newPassword,
      })
      .subscribe({
        next: () => {
          this.success = true;
          this.error = null;
        },
        error: (err) => {
          console.error(err);
          this.error =
            err?.error?.message || 'Failed to reset password. Try again.';
        },
      });
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }
}
