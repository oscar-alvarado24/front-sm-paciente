import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../../common/services/auth/auth';
import { SHARED_IMPORTS } from '../../../common/shared-imports';
import { Email } from '../email/email';
import { Router } from '@angular/router';

@Component({
  selector: 'app-recover-password',
  imports: [SHARED_IMPORTS, Email],
  templateUrl: './recover-password.html',
  styleUrl: './recover-password.scss',
})
export class RecoverPassword {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  emailValue = '';
  isEmailValid = false;
  isLoading = signal(false);

  onEmailValid(emailIsValid: boolean): void {
    this.isEmailValid = emailIsValid;
  }

  onEmailValue(email: string): void {
    this.emailValue = email;
  }

  async recoverPassword(): Promise<void> {
    this.isLoading.set(true);
    try {
      const response = await this.authService.handleResetPassword(this.emailValue);
      if (response.status === 'correct') {
        this.router.navigate(['change-password']);
      } else {
        alert('Error interno, intenta más tarde');
      }
    } finally {
      this.isLoading.set(false);
    }
  }
}
