import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { AuthService } from '../../auth.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  form: FormGroup;
  loading = false;
  error: string | null = null;
  emailVerificationNotice: boolean = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        username: ['', Validators.required],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(6),
            Validators.maxLength(128),
            Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).{6,}$/)

          ],
        ],
        confirmPassword: ['', Validators.required],
      },
      {
        validators: this.passwordMatchValidator(),
      }
    );
  }

  submit() {
    if (this.form.invalid) return;

    this.loading = true;
    this.error = null;

    const { email, username, password } = this.form.value;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.auth.register(email, password, username).subscribe({
      next: (res) => {
        this.loading = false;
        this.emailVerificationNotice = true;
      },
      error: (err) => {

        console.log('err: ', err);
        const backendMsg = err?.error?.error?.message;

        console.log('backenderr msg: ', backendMsg);

        if (backendMsg === 'Email is already in use.') {
          this.error = 'This email is already registered.';
        } else if (backendMsg === 'Username is already taken.') {
          this.error = 'This username is already taken.';
        } else if (backendMsg === 'Password must be at least 6 characters long.') {
          this.error = 'Your password does not meet the requirements.';
        } else {
          this.error = 'Registration failed. Please try again.';
        }

        this.loading = false;
        console.error(err);
      },
    });
  }

  private passwordMatchValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const password = group.get('password')?.value;
      const confirm = group.get('confirmPassword')?.value;
      return password === confirm ? null : { mismatch: true };
    };
  }
}
