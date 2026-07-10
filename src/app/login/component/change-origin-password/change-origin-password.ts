import { Component, inject, output, signal } from '@angular/core';
import { AuthService } from '../../../common/services/auth/auth';
import { Password } from '../password/password';

@Component({
  selector: 'app-change-origin-password',
  imports: [Password],
  templateUrl: './change-origin-password.html',
  styleUrl: './change-origin-password.scss',
})
export class ChangeOriginPassword {
  private readonly authService = inject(AuthService);

  readonly sharedSecretEmmiter = output<string>();
  readonly currentStateEmitter = output<string>();

  /** Datos de contraseña recibidos del componente hijo app-password */
  readonly passwordData = signal<{ password: string; confirmPassword: string } | null>(null);

  /** Determina si se cumplen todos los condicionales para las contraseñas */
  readonly arePasswordValid = signal(false);

  /** Indica si hay una petición en curso (cambiar contraseña) */
  readonly isLoading = signal(false);

  /**
   * @description Maneja los cambios en la contraseña desde el componente hijo
   * @param passwordData Objeto con la contraseña y su confirmación
   */
  onPasswordsValue(passwordData: { password: string; confirmPassword: string }): void {
    this.passwordData.set(passwordData);
  }

  /**
   * @description Maneja los cambios de estado en el cumplimiento de las condicionales de las contraseñas desde el componente hijo
   * @param passwordAreValid Valor del estado del cumplimiento de las condicionales de las contraseñas
   */
  onPasswordValid(passwordAreValid: boolean): void {
    this.arePasswordValid.set(passwordAreValid);
  }

  /**
   * @description Completa el proceso de cambio de contraseña requerido
   * y maneja la posible configuración de MFA posterior
   */
  async changePassword(): Promise<void> {
    const data = this.passwordData();
    if (!data) {
      return;
    }

    this.isLoading.set(true);
    try {
      const response = await this.authService.completeNewPasswordChallenge(data.password);
      if (response.nextStep.signInStep === 'CONTINUE_SIGN_IN_WITH_TOTP_SETUP') {
        alert('Contraseña cambiada exitosamente, ahora debes configurar la autenticación multifactor (MFA)');
        this.sharedSecretEmmiter.emit(response.nextStep.totpSetupDetails.sharedSecret);
        this.currentStateEmitter.emit('VIEW QR');
      }
    } finally {
      this.isLoading.set(false);
    }
  }
}