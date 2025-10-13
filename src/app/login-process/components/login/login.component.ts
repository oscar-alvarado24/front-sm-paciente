import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from 'src/app/login-process/service/auth/auth.service';
import { Router } from '@angular/router';
import { PatientService } from 'src/app/commons/service/graphQL/patient-st/patient-st.service';
import { StorageService } from 'src/app/commons/service/localStotarage/local-storage.service'
import { EmailComponent } from '../email/email.component';
import { PasswordComponent } from '../password/password.component';
import { CodeTotpComponent } from '../code-totp/code-totp.component';
import { SessionService } from '../../service/session/service/session.service';
import * as QRCode from 'qrcode';
import { finalize, switchMap, tap } from 'rxjs/operators';
import { ProcedureService } from '../../../commons/service/procedure/service/procedure.service';
import { ProcessProcedures } from '../../../patient-home/components/procedures-target/class/process-procedures';
import { EmployeeService } from '../../../commons/service/employee/service/employee.service';
import { ProviderService } from '../../../commons/service/provider/service/provider.service';
import { BranchRequest } from 'src/app/commons/service/provider/interface/branch-request';
import { Doctor } from '../../../commons/service/employee/interface/employee';
import { MedicalProcedure } from '../../../commons/service/procedure/interface/medical-procedure';
import { Branch } from '../../../commons/service/provider/interface/provider';
import { TargetProcedure } from '../../../patient-home/interface/target-procedure';
import { Observable, of } from 'rxjs';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';

/**
 * @description Componente que maneja el proceso de autenticación de usuarios,
 * incluyendo login inicial, cambio de contraseña y configuración de autenticación MFA
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, EmailComponent, PasswordComponent, CodeTotpComponent, LoadingSpinnerComponent], 
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

  showSpinner: boolean = false;

  procedureData: MedicalProcedure[] = [];
  doctorData: Doctor[] = [];
  branchData: Branch[] = [];

  /**
   * @description Inicializa el componente y configura el formulario reactivo
   * @param authService Servicio para manejar la autenticación
   * @param patientService Servicio para manejar la autenticación
   * @param router Servicio para la navegación
   * @param storageService Servicio para manejar el almacenamiento local
   * @param sessionService Servicio para consumir las lambda de session
   * @param procedureService Servicio para consumir la api de los procedimientos médicos del paciente
   */
  constructor(
    private readonly authService: AuthService,
    private readonly patientService: PatientService,
    private readonly router: Router,
    private readonly storageService: StorageService,
    private readonly sessionService: SessionService,
    private readonly procedureService: ProcedureService,
    private readonly employeeService: EmployeeService,
    private readonly providerService: ProviderService
  ) {
    this.authService = authService;
    this.patientService = patientService;
    this.router = router;
    this.storageService = storageService;
    this.sessionService = sessionService;
    this.procedureService = procedureService;
    this.employeeService = employeeService;
    this.providerService = providerService;
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
        this.storageService.setItem("patient", getPatient.id);
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
            this.showSpinner = true;
            this.handleSuccessfulTotp();
            this.storageService.setItem("email", this.emailValue);
          } else {
            alert("Tempo de secion expirado, debes iniciar el proceso de registro de la aplicacion de nuevo")
            this.currentState = "INITIAL";
          }
        })
    }
  }

  private handleSuccessfulTotp() {
    this.procedureService.getProceduresByPatientId(parseInt(this.storageService.getItem("patient")), "PRINCIPAL_PAGE", 3)
      .pipe(
        switchMap((procedures) => {
          this.procedureData = procedures;
          if (procedures.length === 0) {
            return of(null);
          }
          return this.consultDoctorsAndBranchesData(procedures);
        }),
        finalize(() => this.handleSession())
      )
      .subscribe({
        next: () => {
          console.log('Todo el proceso completado exitosamente');
        },
        error: (error) => {
          console.error('Error:', error);
        }
      });
  }

  private consultDoctorsAndBranchesData(procedures: any): Observable<void> {
    const doctorIds: number[] = [...new Set((procedures as Array<{ doctorId: number }>).map(p => Number(p.doctorId)))];
    return this.employeeService.getDoctorByIds(doctorIds).pipe(
      switchMap((doctors) => {
        this.doctorData = doctors;

        if (doctors.length === 0) {
          return of(undefined);
        }

        return this.handleDoctors(doctors).pipe(
          // Map the result to void
          switchMap(() => of(undefined))
        );
      })
    );
  }

  private handleDoctors(doctors: Doctor[]): Observable<Branch[]> {
    const branchRequests: BranchRequest[] = Array.from(
      doctors.reduce((map, doc: Doctor) => {
        const key = `${doc.company}|${doc.workplace}`;
        if (!map.has(key)) {
          map.set(key, { company_id: doc.company.toString(), branch_id: doc.workplace });
        }
        return map;
      }, new Map<string, BranchRequest>()).values()
    );
    return this.providerService.getBranchesByIds(branchRequests).pipe(
      tap((branches) => {
        this.branchData = branches;
        const targetProcedures: TargetProcedure[] = ProcessProcedures.createTargetProcedureList(
          this.procedureData,
          this.doctorData,
          this.branchData
        );
        ProcessProcedures.classifyAppointments(targetProcedures, this.storageService);
      })
    );
  }

  private handleSession() {
    this.sessionService.getLastSession(this.emailValue)
      .pipe(
        //tap((lastSession) => {
        finalize(() => {
          this.showSpinner = false;
          this.router.navigate(['/home-patient']);
        })
      )
      .subscribe({
        error: (error) => {
          console.error('Error:', error);
        }
      });
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