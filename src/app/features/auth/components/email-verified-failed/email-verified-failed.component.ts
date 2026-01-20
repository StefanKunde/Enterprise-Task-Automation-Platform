import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-email-verified-failed',
  templateUrl: './email-verified-failed.component.html',
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule]
})
export class EmailVerifiedFailedComponent {
  resendSuccess = false;
  resendError = false;
  email = '';
  success = false;

  constructor(private readonly http: HttpClient, private readonly auth: AuthService) {}

  requestVerification() {
    this.auth.resendVerificationEmail(this.email).subscribe({
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
}
