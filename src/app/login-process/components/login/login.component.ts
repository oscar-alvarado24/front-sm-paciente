import { Component } from '@angular/core';
import { AuthService } from 'src/app/login-process/service/auth/auth.service';
import { Router } from '@angular/router';
import { PatientService } from '../../service/patient/patient.service';
import { PatientCtService } from 'src/app/commons/service/patient-ct/patient.service';
import { StorageService } from 'src/app/commons/service/localStotarage/local-storage.service'

/**
 * @description Componente que maneja el proceso de autenticación de usuarios,
 * incluyendo login inicial, cambio de contraseña y configuración de autenticación MFA
 */
@Component({
  selector: 'app-login',
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
    private readonly patientCtService: PatientCtService,
    private readonly router: Router,
    private readonly storageService: StorageService
  ) {
    this.authService = authService;
    this.patientService = patientService;
    this.router = router;
    this.storageService = storageService;
    this.patientCtService = patientCtService;
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
    console.log(this.emailValue);
    this.patientService.validatePatient(this.emailValue).subscribe({
      next: (validatePatient: any) => {
        console.log(validatePatient);
        switch (validatePatient) {
          case 'usuario_activo':
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
          console.log("autenticacion MFA")
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
            const role= await this.authService.getCurrentUserWithRole();
            switch(role){
              case 'pacientes':
                this.patientCtService.getPatient(this.emailValue).subscribe({
                  next: (result) => {
                    this.storageService.setItem("photo",result);
                  },
                  error: (error) => {
                    console.error('Error al consultar el paciente:', error);
                    
                  }
                });
                this.router.navigate(['/home-patient']);
                this.storageService.setItem("email",this.emailValue);
                break;
              case 'ADMIN':
                this.router.navigate(['/home-admin']);
                break;
              default:
                // Manejar caso sin rol o rol desconocido
                this.router.navigate(['/login']);
            }
            
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
  qrInscription(sharedSecret: any) {
    this.authService.enableTOTP(this.emailValue, sharedSecret)
    this.qrCodeUrl = this.authService.qrCodeUrl
    this.currentState = "VIEW QR"
  }

  /**
   * @description Inicia el proceso de recuperación de contraseña
   */
  forgotPassword() {
    this.authService.handleResetPassword(this.emailValue).then(response => {
      console.log(response)
      if (response.status == "correct") {
        this.router.navigate(['change-password']);
      } else {
        alert("Error interno intenta mas tarde")
      }
    });
  }
}