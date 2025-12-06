import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
import { InitialFormComponent } from '../initial-form/initial-form.component';
import { ChangeOriginPasswordComponent } from '../change-origin-password/change-origin-password.component';
import { QrCodeComponent } from '../qr-code/qr-code.component';
import { TotpCodeProcessComponent } from '../totp-code-process/totp-code-process.component';
import { finalize, Subject, takeUntil } from 'rxjs';
import { ProcessBeforeChangeRouteService } from '../../service/process-before-change-route/process-before-change-route.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, InitialFormComponent, LoadingSpinnerComponent, ChangeOriginPasswordComponent, QrCodeComponent, TotpCodeProcessComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  currentState: string = "INITIAL";
  sharedSecret: string = "";
  totpProcessSuccesful: boolean = false;
  showSpinner: boolean = false;
  isLoading = false;
  proceduresData: any;
  sessionData: any;
  hasErrors = false;
  errorMessages: string[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private readonly router: Router,
    private readonly processBeforeChangeRouteService: ProcessBeforeChangeRouteService
  ) {}

  ngOnInit(): void {
    console.log("Iniciando el componente de login con currentState en: ", this.currentState)
  }

  onCurrentState(state: string) {
    this.currentState = state;
    console.log("cambiando el valor de current State :", this.currentState)
  }

  onSharedSecret(sharedSecret: string) {
    this.sharedSecret = sharedSecret;
  }

  onTotpProcessSuccessful(success: boolean) {
    this.totpProcessSuccesful = success;
    if(this.totpProcessSuccesful){
      this.showSpinner = true;
      this.loadPatientHomeData();
    }
  }

  async loadPatientHomeData(): Promise<void> {
    console.log("Cargando datos del paciente");
    this.isLoading = true;
    this.hasErrors = false;
    this.errorMessages = [];

    this.processBeforeChangeRouteService.executeProcess()
      .pipe(
        takeUntil(this.destroy$), // Importante: controla la destrucción
        finalize(() => {
          this.isLoading = false;
          this.showSpinner = false;
        })
      )
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

          // ✅ SOLO navegar si NO hay errores y todo se completó exitosamente
          if (!this.hasErrors) {
            console.log('Navegando a home-patient');
            this.router.navigate(['home-patient']);
          } else {
            console.error('No se puede navegar debido a errores:', this.errorMessages);
          }
        },
        error: (error) => {
          console.error('Error crítico:', error);
          this.hasErrors = true;
          this.errorMessages.push('Error al cargar los datos');
          // NO navegar en caso de error
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