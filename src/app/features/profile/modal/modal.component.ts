import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Output, EventEmitter } from '@angular/core';


@Component({
  selector: 'app-modal',
  standalone: true,
  templateUrl: './modal.component.html',
  imports: [FormsModule, CommonModule]
})
export class ModalComponent {
  @Input() show = false;
  @Output() onClose = new EventEmitter<void>();
  @Input() onMerge = (email: string, password: string) => {};

  email = '';
  password = '';
  errorMessage = '';
  successMessage = '';
  loading = false;

  submitMerge() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Please enter both email and password.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.onMerge(this.email, this.password);
  }

  close() {
    this.onClose.emit();
  }

}
