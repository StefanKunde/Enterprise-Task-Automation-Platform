import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-failed',
  imports: [CommonModule, RouterModule],
  templateUrl: './failed.component.html',
})
export class FailedComponent {
  orderId = new URLSearchParams(location.search).get('order') || '';
}
