import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from 'src/app/login-process/service/auth/auth.service';
import { Router } from '@angular/router';
import { PatientService } from 'src/app/commons/service/graphQL/patient-st/patient-st.service';
import { StorageService } from 'src/app/commons/service/localStotarage/local-storage.service'
import { EmailComponent } from '../email/email.component';
import { PasswordComponent } from '../password/password.component';
import { CodeTotpComponent } from '../code-totp/code-totp.component';
import { SessionService } from '../../../patient-home/service/session/session.service';
import * as QRCode from 'qrcode'; // Importación correcta
import { finalize } from 'rxjs/operators';

/**
 * @description Componente que maneja el proceso de autenticación de usuarios,
 * incluyendo login inicial, cambio de contraseña y configuración de autenticación MFA
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, EmailComponent, PasswordComponent, CodeTotpComponent], // Removido QRCodeModule
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  /** Estado actual del flujo de autenticación */
  currentState: string = "INITIAL";

  /** Datos de contraseña recibidos del componente hijo app-password */
  passwordData: { password: string, confirmPassword: string } | null = null;

  /**boleano para determinar si se cumplen todos los condicionales para las contraseas*/
  arePasswordValid: boolean = false;

  /** URL del código QR para configuración MFA */
  qrCodeUrl: string = "";

  /** Imagen del código QR generada como base64 */
  qrCodeImage: string = "";

  /** Valor del email del usuario para referencia durante el flujo de autenticación */
  emailValue: string = "";

  /** boleano para determinar si se cumplen todos los condicionales para el email*/
  isEmailValid: boolean = false;

  /** Valor del codigo totp */
  codeValue: string = "";

  /** boleano para determinar si se cumplen todos los condicionales para el codigo totp */
  isCodeValid: boolean = false;

  /** boleano para controlar el reset del campo del codigo */
  resetCode: boolean = false;

  /**
   * @description Inicializa el componente y configura el formulario reactivo
   * @param authService Servicio para manejar la autenticación
   * @param patientService Servicio para manejar la autenticación
   * @param router Servicio para la navegación
   */
  constructor(
    private readonly authService: AuthService,
    private readonly patientService: PatientService,
    private readonly router: Router,
    private readonly storageService: StorageService,
    private readonly sessionService: SessionService
  ) {
    this.authService = authService;
    this.patientService = patientService;
    this.router = router;
    this.storageService = storageService;
    this.sessionService = sessionService;
  }

  /**
   * @description Genera el código QR a partir de la URL
   * @param qrUrl URL para generar el código QR
   */
  private async generateQRCode(qrUrl: string): Promise<void> {
    try {
      this.qrCodeImage = await QRCode.toDataURL(qrUrl, {
        width: 200,
        errorCorrectionLevel: 'M',
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (error) {
      console.error('Error generando código QR:', error);
    }
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
        this.storageService.setItem("photo", getPatient.photo);
        switch (getPatient.status) {
          case 'usuario_activo':
            console.log('Usuario activo, iniciando sesión');
            this.startFlowSesion();
            break;
          case 'usuario_inactivo':
            alert('Usuario inactivo, valida con tu empresa e pago de tus aportes');
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
        switch (response.nextStep.signInStep) {
          case "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED":
            console.log("Cambio de contraseña")
            alert("Debes cambiar la contraseña")
            this.arePasswordValid = false;
            this.currentState = "NEW_PASSWORD_REQUIRED"
            break
          case "CONTINUE_SIGN_IN_WITH_TOTP_SETUP":
            this.qrInscription(response.nextStep.totpSetupDetails.sharedSecret)
            break
          case "CONFIRM_SIGN_IN_WITH_TOTP_CODE":
            this.currentState = "SEND TOTP CODE"
        }
      }
    });
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
          this.qrInscription(response.nextStep.totpSetupDetails.sharedSecret)
        }
      })
    }
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
            console.log("Autenticación exitosa, redirigiendo a la página principal")
            this.sessionService.getLastSession(this.emailValue)
              .pipe(
                finalize(() => {
                  this.router.navigate(['/home-patient']);
                })
              )
              .subscribe({
                error: (error) => {
                  console.error('Error:', error);
                }
              });
            this.storageService.setItem("email", this.emailValue);
          } else {
            alert("Tempo de secion expirado, debes iniciar el proceso de registro de la aplicacion de nuevo")
            this.currentState = "INITIAL";
          }
        })
    }
  }

  /**
   * @description Configura la inscripción MFA generando el código QR
   * @param sharedSecret Secreto compartido para generar el código QR
   */
  async qrInscription(sharedSecret: any) {
    this.authService.enableTOTP(this.emailValue, sharedSecret)
    this.qrCodeUrl = this.authService.qrCodeUrl
    // Generar la imagen del QR code
    await this.generateQRCode(this.qrCodeUrl);
    this.currentState = "VIEW QR"
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