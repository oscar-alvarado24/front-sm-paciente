import { Component, EventEmitter, Output } from '@angular/core';
import { PasswordComponent } from '../password/password.component';
import { AuthService } from '../../../commons/service/auth/auth.service';

@Component({
  selector: 'app-change-origin-password',
  standalone: true,
  imports: [PasswordComponent],
  templateUrl: './change-origin-password.component.html',
  styleUrls: ['./change-origin-password.component.css']
})
export class ChangeOriginPasswordComponent {

  @Output() sharedSecretEmmiter = new EventEmitter<string>();
  @Output() currentStateEmitter = new EventEmitter<string>();
  /** Datos de contraseña recibidos del componente hijo app-password */
  passwordData: { password: string, confirmPassword: string } | null = null;

  /**boleano para determinar si se cumplen todos los condicionales para las contraseas*/
  arePasswordValid: boolean = false;

  constructor(
    private readonly authService: AuthService
  ) {
    this.authService = authService;
  }

  /**
   * @description Maneja los cambios en la contraseña desde el componente hijo
   * @param passwordData Objeto con la contraseña y su confirmación
   */
  onPasswordsValue(passwordData: { password: string, confirmPassword: string }) {
    this.passwordData = passwordData;
  }

  /**
   * @description Maneja los cambios de estado en el cumplimiento de las condicionales de las contraseñas desde el componente hijo
   * @param emailIsValid Objeto con el valor del estado del cumplimiento de las condicionales de las contraseñas
   */
  onPasswordValid(passwordAreValid: boolean) {
    this.arePasswordValid = passwordAreValid;
  }

  /**
   * @description Completa el proceso de cambio de contraseña requerido
   * y maneja la posible configuración de MFA posterior
   */
  changePassword() {
    if (this.passwordData) {
      this.authService.completeNewPasswordChallenge(this.passwordData.password).then(response => {
        if (response.nextStep.signInStep === "CONTINUE_SIGN_IN_WITH_TOTP_SETUP") {
          alert("Contraseña cambiada exitosamente, ahora debes configurar la autenticación multifactor (MFA)")
          this.sharedSecretEmmiter.emit(response.nextStep.totpSetupDetails.sharedSecret);
          this.currentStateEmitter.emit('VIEW QR')
        }
      })
    }
  }

}
