import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChangeOriginPassword } from '../change-origin-password/change-origin-password';
import { Form } from '../form/form';
import { ProcessBeforeChangeRouteService } from '../../service/process-before-change-route/process-before-change-route-service';
import { LoadingSpinner } from '../loading-spinner/loading-spinner';
import { QrCode } from '../qr-code/qr-code';
import { TotpCodeProcess } from '../totp-code-process/totp-code-process';


@Component({
  selector: 'app-login-process',
  imports: [
    RouterModule,
    Form,
    LoadingSpinner,
    ChangeOriginPassword,
    QrCode,
    TotpCodeProcess
  ],
  templateUrl: './login-process.html',
  styleUrl: './login-process.scss',
})
export class LoginProcess implements OnInit {
  private readonly router = inject(Router);
  private readonly processBeforeChangeRouteService = inject(ProcessBeforeChangeRouteService);
  private readonly destroyRef = inject(DestroyRef);

  readonly currentState = signal('INITIAL');
  readonly sharedSecret = signal('');
  readonly totpProcessSuccesful = signal(false);
  readonly showSpinner = signal(false);
  readonly isLoading = signal(false);
  readonly hasErrors = signal(false);
  readonly errorMessages = signal<string[]>([]);

  ngOnInit(): void {
    console.log('Iniciando el componente de login con currentState en: ', this.currentState());
  }

  onCurrentState(state: string): void {
    this.currentState.set(state);
    console.log('cambiando el valor de current State :', this.currentState());
  }

  onSharedSecret(sharedSecret: string): void {
    this.sharedSecret.set(sharedSecret);
  }

  onTotpProcessSuccessful(success: boolean): void {
    this.totpProcessSuccesful.set(success);
    if (success) {
      this.showSpinner.set(true);
      this.loadPatientHomeData();
    }
  }

  loadPatientHomeData(): void {
    console.log('Cargando datos del paciente');
    this.isLoading.set(true);
    this.hasErrors.set(false);
    this.errorMessages.set([]);

    this.processBeforeChangeRouteService.executeProcess()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          console.log('Navegando a home-patient inmediatamente');
          this.router.navigate(['home-patient']);
        })
      )
      .subscribe({
        next: (result) => {
          console.log('Datos recibidos:', result);
          this.isLoading.set(false);
          this.showSpinner.set(false);
        },
        error: (error: unknown) => {
          console.error('Error crítico:', error);
          this.isLoading.set(false);
          this.showSpinner.set(false);
        },
        complete: () => {
          this.isLoading.set(false);
          this.showSpinner.set(false);
        }
      });
  }

  retry(): void {
    this.loadPatientHomeData();
  }
}
