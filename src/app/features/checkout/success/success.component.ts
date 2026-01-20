import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-success',
  imports: [CommonModule, RouterModule],
  templateUrl: './success.component.html',
})
export class SuccessComponent {
  orderId = new URLSearchParams(location.search).get('order') || '';
}
