import { Component, EventEmitter, Output, inject } from '@angular/core';
import { PasswordComponent } from '../password/password.component';
import { AuthService } from '../../../commons/service/auth/service/auth.service';

@Component({
  selector: 'app-change-origin-password',
  templateUrl: './change-origin-password.component.html',
  styleUrls: ['./change-origin-password.component.css'],
  standalone: true,
  imports: [PasswordComponent]
})
export class ChangeOriginPasswordComponent {
  @Output() sharedSecretEmmiter = new EventEmitter<string>();
  @Output() currentStateEmitter = new EventEmitter<string>();

  /** Datos de contraseña recibidos del componente hijo app-password */
  passwordData: { password: string; confirmPassword: string } | null = null;

  /** Booleano para determinar si se cumplen todos los condicionales para las contraseñas */
  arePasswordValid = false;

  private readonly authService = inject(AuthService);

  /**
   * Maneja los cambios en la contraseña desde el componente hijo
   * @param passwordData Objeto con la contraseña y su confirmación
   */
  onPasswordsValue(passwordData: { password: string; confirmPassword: string }): void {
    this.passwordData = passwordData;
  }

  /**
   * Maneja los cambios de estado en el cumplimiento de las condicionales de las contraseñas
   * @param passwordAreValid Estado del cumplimiento de las condicionales
   */
  onPasswordValid(passwordAreValid: boolean): void {
    this.arePasswordValid = passwordAreValid;
  }

  /**
   * Completa el proceso de cambio de contraseña requerido
   * y maneja la posible configuración de MFA posterior
   */
  changePassword(): void {
    if (this.passwordData) {
      this.authService.completeNewPasswordChallenge(this.passwordData.password).then((response) => {
        if (response.nextStep.signInStep === 'CONTINUE_SIGN_IN_WITH_TOTP_SETUP') {
          alert('Contraseña cambiada exitosamente, ahora debes configurar la autenticación multifactor (MFA)');
          this.sharedSecretEmmiter.emit(response.nextStep.totpSetupDetails.sharedSecret);
          this.currentStateEmitter.emit('VIEW QR');
        }
      });
    }
  }
}