import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-email-verified-success',
  templateUrl: './email-verified-success.component.html',
  standalone: true,
  imports: [RouterModule]
})
export class EmailVerifiedSuccessComponent {
  constructor(private readonly router: Router) {}

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }
}
