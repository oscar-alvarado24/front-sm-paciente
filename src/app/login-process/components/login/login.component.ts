import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
import { InitialFormComponent } from '../initial-form/initial-form.component';
import { ChangeOriginPasswordComponent } from '../change-origin-password/change-origin-password.component';
import { QrCodeComponent } from '../qr-code/qr-code.component';
import { TotpCodeProcessComponent } from '../totp-code-process/totp-code-process.component';
import { finalize, Subject, takeUntil } from 'rxjs';
import { ProcessBeforeChangeRouteService } from '../../service/process-before-change-route.service';

/**
 * @description Componente que maneja el proceso de autenticación de usuarios,
 * incluyendo login inicial, cambio de contraseña y configuración de autenticación MFA
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, InitialFormComponent, LoadingSpinnerComponent, ChangeOriginPasswordComponent, QrCodeComponent, TotpCodeProcessComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  /** Estado actual del flujo de autenticación */
  currentState: string = "INITIAL";

  sharedSecret: string = "";

  totpProcessSuccesful: boolean = false;

  showSpinner: boolean = false;

  //pruebra siendo login quien consume el servicio:
  isLoading = false;
  proceduresData: any;
  sessionData: any;
  hasErrors = false;
  errorMessages: string[] = [];
  
  private destroy$ = new Subject<void>();

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
    private readonly router: Router,
    private readonly processBeforeChangeRouteService: ProcessBeforeChangeRouteService
  ) {
    this.router = router;
  }
  
  onCurrentState(state: string) {
    this.currentState = state;
    console.log ("cambiando el valor de current State :", this.currentState)
  }

  onSharedSecret(sharedSecret: string) {
    this.sharedSecret = sharedSecret;
  }

  onTotpProcessSuccessful(success: boolean) {
    this.totpProcessSuccesful = success;
    if(this.totpProcessSuccesful){
      this.showSpinner=true;
      this.loadPatientHomeData()
    }
  }



  loadPatientHomeData(): void {
    console.log("Cargando datos del paciente")
    this.isLoading = true;
    this.hasErrors = false;
    this.errorMessages = [];

    this.processBeforeChangeRouteService.executeProcess()
      .pipe(
        //takeUntil(this.destroy$),
        finalize(()=> this.router.navigate(['home-patient'])))
      .subscribe({
        next: (result) => {
          console.log('Datos recibidos:', result);

          // Procesar resultado de procedures
          if (result.procedureFlow.success) {
            console.log('Procedures cargados correctamente');
          } else {
            this.hasErrors = true;
            this.errorMessages.push('Error al cargar procedimientos');
            console.error('Error en procedures:', result.procedureFlow.error);
    }

          // Procesar resultado de session
          if (result.sessionFlow.success) {
            console.log('Session cargada correctamente');
          } else {
            this.hasErrors = true;
            this.errorMessages.push('Error al cargar sesión');
            console.error('Error en session:', result.sessionFlow.error);
          }

          this.isLoading = false;
          this.showSpinner = false;
        },
        error: (error) => {
          // Este error solo ocurriría si falla el forkJoin completamente
          console.error('Error crítico:', error);
          this.hasErrors = true;
          this.errorMessages.push('Error al cargar los datos');
          this.isLoading = false;
          this.showSpinner = false;
        }
      });
      
  }

  retry(): void {
    this.loadPatientHomeData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    }
  }

