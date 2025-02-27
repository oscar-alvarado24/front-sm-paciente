import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/login-process/service/auth/auth.service';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent {

  /** Estado actual del flujo de cambi de contraseña */
  currentState: string = "INITIAL";

  /** Valor del codigo totp */
  codeValue: string = "";

  /** boleano para determinar si se cumplen todos los condicionales para el codigo totp */
  isCodeValid: boolean = false;

  /** boleano para controlar el reset del campo del codigo */
  resetCode: boolean = false;

  /** Datos de contraseña recibidos del componente hijo app-password */
  passwordData: { password: string, confirmPassword: string } | null = null;

  /**boleano para determinar si se cumplen todos los condicionales para las contraseas*/
  arePasswordValid: boolean = false;

  /** Valor del email del usuario para referencia durante el flujo de autenticación */
  emailValue: string = "";

  /** boleano para determinar si se cumplen todos los condicionales para el email*/
  isEmailValid: boolean = false;

  /** boleano para determinar si el contador ya finalizo */
  timerFinished: boolean = false;

  /**boleano que controla el inicio del contador */
  startCountDown: boolean = false;

  /**
     * @description Inicializa el componente y configura el formulario reactivo
     * @param authService Servicio para manejar la autenticación
     * @param router Servicio para la navegación
     */
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {
    this.authService = authService;
    this.router = router;
  }

  /**
   * @description Maneja los cambios de estado en el cumplimiento de las condicionales del email desde el componente hijo
   * @param emailIsValid Objeto con el valor del estado del cumplimiento de las condicionales del email
   */
  onEmailValid(emailIsValid: boolean) {
    this.isEmailValid = emailIsValid;
  }

  /**
   * @description Maneja los cambios en el email desde el componente hijo
   * @param email Objeto con el email
   */
  onEmailValue(email: string) {
    this.emailValue = email;
  }

  /**
   * @description Maneja los cambios de estado en el cumplimiento de las condicionales del codigo  totp desde el componente hijo
   * @param emailIsValid Objeto con el valor del estado del cumplimiento de las condicionales del codigo
   */
  onCodeValid(codeIsValid: boolean) {
    this.isCodeValid = codeIsValid;
  }

  /**
   * @description Maneja los cambios en el codigo totp desde el componente hijo
   * @param code Objeto con el codigo totp
   */
  onCodeValue(code: string) {
    this.codeValue = code;
  }

  /**
   * @description Controla cuando se debe envir un reset al componente de codigo-totp
   */
  clearCode() {
    this.resetCode = true;
    // Volver a false para futuros resets
    setTimeout(() => this.resetCode = false, 0);
  }
  
  startCountdown() {
    this.startCountDown = true;
    // Volver a false para futuros resets
    setTimeout(() => this.startCountDown = false, 0);
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

  changePassword() {
    this.authService.handleConfirmResetPassword({
      username: this.emailValue,
      confirmationCode: this.codeValue,
      newPassword: this.passwordData?.password!
    }).then(response => {
      console.log(response);
      if (response.status == "correct") {
        this.router.navigate(['change-password']);
        this.clearCode();
      } else {
        this.currentState = 'RESEND CODE';
        this.startCountdown();
        let alertMessage: string;
        if (response.name == "CodeMismatchException") {
          alertMessage = "codigo totp incorrecto, ingresa el codigo enviado o solicita uno nuevo";
        } else if (response.name == "ExpiredCodeException") {
          alertMessage = "Codigo totp vencido solicita uno nuevo";
        } else {
          alertMessage = "Error interno intenta mas tarde";
        }
        alert(alertMessage);
      }
    })
  }

  resendCode() {
    this.startCountdown();
    this.authService.handleResetPassword(this.emailValue).then(response => {
      console.log(response)
      if (response.status == "correct") {
        alert("Codigo reenviado correctamente");
      } else {
        alert("Error interno intenta mas tarde")
      }
    })
  }

  onTimerFinished(timerIsFinished: boolean){
    this.timerFinished = timerIsFinished;
  }

}