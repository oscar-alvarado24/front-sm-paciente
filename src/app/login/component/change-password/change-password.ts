import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../../common/services/auth/auth';
import { Email } from '../email/email';
import { Password } from '../password/password';
import { CodeTotp } from '../code-totp/code-totp';
import { CountDown } from '../count-down/count-down';
import { Router } from '@angular/router';

@Component({
  selector: 'app-change-password',
  imports: [Email, CodeTotp, CountDown, Password],
  templateUrl: './change-password.html',
  styleUrl: './change-password.scss',
})
export class ChangePassword {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  /** Estado actual del flujo de cambio de contraseña */
  readonly currentState = signal('INITIAL');

  /** Valor del codigo totp */
  readonly codeValue = signal('');

  /** Determina si se cumplen todos los condicionales para el codigo totp */
  readonly isCodeValid = signal(false);

  /** Controla el reset del campo del codigo */
  readonly resetCode = signal(false);

  /** Datos de contraseña recibidos del componente hijo app-password */
  readonly passwordData = signal<{ password: string; confirmPassword: string } | null>(null);

  /** Determina si se cumplen todos los condicionales para las contraseñas */
  readonly arePasswordValid = signal(false);

  /** Valor del email del usuario para referencia durante el flujo de autenticación */
  readonly emailValue = signal('');

  /** Determina si se cumplen todos los condicionales para el email */
  readonly isEmailValid = signal(false);

  /** Determina si el contador ya finalizó */
  readonly timerFinished = signal(false);

  /** Controla el inicio del contador */
  readonly startCountDown = signal(false);

  /** Indica si hay una petición en curso (cambiar contraseña) */
  readonly isLoading = signal(false);

  /** Indica si hay una petición en curso (reenviar código) */
  readonly isResending = signal(false);

  onEmailValid(emailIsValid: boolean): void {
    this.isEmailValid.set(emailIsValid);
  }

  onEmailValue(email: string): void {
    this.emailValue.set(email);
  }

  onCodeValid(codeIsValid: boolean): void {
    this.isCodeValid.set(codeIsValid);
  }

  onCodeValue(code: string): void {
    this.codeValue.set(code);
  }

  clearCode(): void {
    this.resetCode.set(true);
    setTimeout(() => this.resetCode.set(false), 0);
  }

  startCountdown(): void {
    this.startCountDown.set(true);
    setTimeout(() => this.startCountDown.set(false), 0);
  }

  onPasswordsValue(passwordData: { password: string; confirmPassword: string }): void {
    this.passwordData.set(passwordData);
  }

  onPasswordValid(passwordAreValid: boolean): void {
    this.arePasswordValid.set(passwordAreValid);
  }

  async changePassword(): Promise<void> {
    const password = this.passwordData()?.password;
    if (!password) {
      return;
    }

    this.isLoading.set(true);
    try {
      console.log('el valor del codigo a confirmar es: ', this.codeValue());
      const response = await this.authService.handleConfirmResetPassword({
        username: this.emailValue(),
        confirmationCode: this.codeValue(),
        newPassword: password,
      });

      console.log(response);
      if (response.status === 'correct') {
        this.router.navigate(['login']);
        this.clearCode();
      } else {
        this.currentState.set('RESEND CODE');
        this.startCountdown();

        let alertMessage: string;
        if (response.name === 'CodeMismatchException') {
          alertMessage = 'codigo totp incorrecto, ingresa el codigo enviado o solicita uno nuevo';
        } else if (response.name === 'ExpiredCodeException') {
          alertMessage = 'Codigo totp vencido solicita uno nuevo';
        } else {
          alertMessage = 'Error interno intenta mas tarde';
        }
        alert(alertMessage);
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  async resendCode(): Promise<void> {
    this.isResending.set(true);
    try {
      this.startCountdown();
      const response = await this.authService.handleResetPassword(this.emailValue());
      console.log(response);
      if (response.status === 'correct') {
        alert('Codigo reenviado correctamente');
      } else {
        alert('Error interno intenta mas tarde');
      }
    } finally {
      this.isResending.set(false);
    }
  }

  onTimerFinished(timerIsFinished: boolean): void {
    this.timerFinished.set(timerIsFinished);
  }
}