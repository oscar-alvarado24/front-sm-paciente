import { Component, EventEmitter, Output } from '@angular/core';
import { CodeTotpComponent } from '../code-totp/code-totp.component';
import { AuthService } from '../../../commons/service/auth/service/auth.service';

@Component({
  selector: 'app-totp-code-process',
  standalone: true,
  imports: [CodeTotpComponent],
  templateUrl: './totp-code-process.component.html',
  styleUrls: ['./totp-code-process.component.css']
})
export class TotpCodeProcessComponent {

  @Output() currentStateEmmiter = new EventEmitter<string>()
  @Output() totpProcessSuccessfulEmitter = new EventEmitter<boolean>();

  /** Valor del codigo totp */
    codeValue: string = "";

    /** boleano para determinar si se cumplen todos los condicionales para el codigo totp */
    isCodeValid: boolean = false;

    /** boleano para controlar el reset del campo del codigo */
    resetCode: boolean = false;

    constructor(
      private readonly authService: AuthService
    ){
      this.authService = authService
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

  /**
     * @description Envía el código TOTP para verificación
     * y maneja la navegación post-autenticación exitosa
     */
    sendTotp() {
      if (this.isCodeValid) {
        this.authService.confirmTotpCode(this.codeValue).then(
          async response => {

            if (response === undefined) {
              console.log("error")
              this.clearCode();
            } else if (response.nextStep.signInStep == 'DONE') {
              this.totpProcessSuccessfulEmitter.emit(true);
            } else {
              alert("Tempo de secion expirado, debes iniciar el proceso de registro de la aplicacion de nuevo")
              this.currentStateEmmiter.emit("INITIAL");
            }
          })
      }
    }
}
