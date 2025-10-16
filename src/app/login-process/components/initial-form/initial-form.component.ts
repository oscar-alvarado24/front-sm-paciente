import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { EmailComponent } from '../email/email.component';
import { PasswordComponent } from '../password/password.component';
import { AuthService } from '../../service/auth/auth.service';
import { Router } from '@angular/router';
import { PatientService } from 'src/app/commons/service/graphQL/patient-st/patient-st.service';
import { StorageService } from '../../../commons/service/localStotarage/local-storage.service';
import { Encrypt } from '../../../commons/class/encrypt';

@Component({
  selector: 'app-initial-form',
  standalone: true,
  imports: [CommonModule, EmailComponent, PasswordComponent],
  templateUrl: './initial-form.component.html',
  styleUrls: ['./initial-form.component.css']
})
export class InitialFormComponent {

  @Output() currentStateEmitter = new EventEmitter<string>()
  @Output() qrInscriptionEmitter = new EventEmitter<string>()


  /** Datos de contraseña recibidos del componente hijo app-password */
  passwordData: { password: string, confirmPassword: string } | null = null;

  /**boleano para determinar si se cumplen todos los condicionales para las contraseas*/
  arePasswordValid: boolean = false;

  /** Valor del email del usuario para referencia durante el flujo de autenticación */
  emailValue: string = "";

  /** boleano para determinar si se cumplen todos los condicionales para el email*/
  isEmailValid: boolean = false;

  constructor(
    private readonly authService: AuthService,
    private readonly patientService: PatientService,
    private readonly router: Router,
    private readonly storageService: StorageService,
  ) {
    this.authService = authService;
    this.patientService = patientService;
    this.router = router;
    this.storageService = storageService;
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
     * @description Inicia el proceso de autenticación y maneja los diferentes flujos posibles:
     * - Cambio de contraseña requerido
     * - Configuración de MFA
     * - Verificación de código TOTP
     */
  signIn() {
    console.log("Iniciando el proceso de autenticación con email:", this.emailValue);
    this.patientService.getPatient(this.emailValue).subscribe({
      next: (getPatient: any) => {
        console.log(getPatient);
        this.storageService.setItem("patient", Encrypt.encryptParam(getPatient.id.toString(),false));
        console.log(getPatient.id);
        this.storageService.setItem("photo", Encrypt.encryptParam(getPatient.photo,false));
        console.log(getPatient.status);
        switch (getPatient.status) {
          case 'usuario_activo':
            console.log('Usuario activo, iniciando sesión');
            this.startFlowSesion();
            break;
          case 'usuario_inactivo':
            alert('Usuario inactivo, valida con tu empresa el pago de tus aportes');
            break;
          case 'usurio_retirado':
            alert('Usuario retirado');
            break;
          default:
            alert('Error interno.');
            break;

        }
      },
      error: (error: any) => {
        console.error('Error al validar el email:', error);
      }
    });
  }

  startFlowSesion() {
    this.authService.signIn(
      this.emailValue,
      this.passwordData!.password
    ).then(response => {
      if (response !== undefined) {
        this.storageService.setItem("email",Encrypt.encryptParam(this.emailValue,false));
        switch (response.nextStep.signInStep) {
          case "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED":
            console.log("Cambio de contraseña")
            alert("Debes cambiar la contraseña")
            this.arePasswordValid = false;
            this.currentStateEmitter.emit("NEW_PASSWORD_REQUIRED")
            break
          case "CONTINUE_SIGN_IN_WITH_TOTP_SETUP":
            this.qrInscriptionEmitter.emit(response.nextStep.totpSetupDetails.sharedSecret)
            this.currentStateEmitter.emit('VIEW QR')
            break
          case "CONFIRM_SIGN_IN_WITH_TOTP_CODE":
            this.currentStateEmitter.emit("SEND TOTP CODE");
            break
        }
      }
    });
  }

  /**
 * @description Inicia el proceso de recuperación de contraseña
 */
  forgotPassword() {
    this.patientService.validateSesStatus(this.emailValue).subscribe({
      next: (validateSesStatus: any) => {
        console.log(validateSesStatus);
        switch (validateSesStatus) {
          case 'Email_verificado':
            this.authService.handleResetPassword(this.emailValue).then(response => {
              console.log(response)
              if (response.status == "correct") {
                this.router.navigate(['change-password']);
              } else {
                alert("Error interno intenta mas tarde")
              }
            });
            break;
          case 'Validacion_reenviada':
            alert('Se ha enviado una validación al correo electrónico, por favor aceptala y reinicia el proceso de recuperación de contraseña');
            break;
          default:
            alert('Error interno.');
            break;
        }
      },
      error: (error: any) => {
        console.error('Error al validar el estado de registro en ses:', error);
      }
    });

  }
}
