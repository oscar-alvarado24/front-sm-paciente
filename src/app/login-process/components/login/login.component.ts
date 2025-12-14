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
  ) { }

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
    if (this.totpProcessSuccesful) {
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
        takeUntil(this.destroy$),
        finalize(() => {
          console.log('Navegando a home-patient inmediatamente');
          this.router.navigate(['home-patient']);
        })
      )
      .subscribe({
        next: (result) => {
          console.log('Datos recibidos:', result);
        },
        error: (error) => {
          console.error('Error crítico:', error);
        },
        complete: () => {
          this.isLoading = false;
          //this.showSpinner = false;
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