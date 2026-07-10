import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../common/services/auth/auth';
import { CryptoService } from '../../../common/services/crypto/crypto';
import { PatientNtService } from '../../../common/services/patient/patient-nt';
import {
  PatientStatus,
  ValidateSesStatusResponse,
} from '../../../common/services/patient/model/response';
import { LocalStorageService } from '../../../common/services/local-storage/local-storage';
import { Email } from '../email/email';
import { Password } from '../password/password';
import { Router } from '@angular/router';

@Component({
  selector: 'app-form',
  imports: [CommonModule, Email, Password],
  templateUrl: './form.html',
  styleUrl: './form.scss',
})
export class Form {
  currentStateEmitter = output<string>();
  qrInscriptionEmitter = output<string>();

  passwordData: { password: string; confirmPassword: string } | null = null;
  arePasswordValid = false;
  emailValue = '';
  isEmailValid = false;
  readonly isLoading = signal(false); // ← nuevo

  private readonly authService = inject(AuthService);
  private readonly patientNtService = inject(PatientNtService);
  private readonly router = inject(Router);
  private readonly storageService = inject(LocalStorageService);
  private readonly cryptoService = inject(CryptoService);
  private readonly destroyRef = inject(DestroyRef);

  onEmailValid(emailIsValid: boolean) {
    this.isEmailValid = emailIsValid;
  }
  onEmailValue(email: string) {
    this.emailValue = email;
  }
  onPasswordsValue(passwordData: { password: string; confirmPassword: string }) {
    this.passwordData = passwordData;
  }
  onPasswordValid(passwordAreValid: boolean) {
    this.arePasswordValid = passwordAreValid;
  }

  signIn(): void {
    this.isLoading.set(true); // ← activar spinner
    this.patientNtService
      .checkPatientStatus(this.emailValue)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: async (status: PatientStatus) => {
          try {
            switch (status) {
              case 'ACTIVE':
                await this.startFlowSesion();
                break;
              case 'INACTIVE':
                alert('Usuario inactivo, valida con tu empresa el pago de tus aportes');
                this.isLoading.set(false); // ← desactivar si no continúa el flujo
                break;
              case 'RETIRED':
                alert('Usuario retirado');
                this.isLoading.set(false);
                break;
              case 'NOT_FOUND':
                alert('Usuario no encontrado, por favor valida el correo electrónico');
                this.isLoading.set(false);
                break;
            }
          } catch (encryptionError) {
            console.error('Error al encriptar datos:', encryptionError);
            alert('Error al procesar los datos de usuario');
            this.isLoading.set(false);
          }
        },
        error: (error: unknown) => {
          console.error('Error al validar el email:', error);
          alert('Error al validar el usuario, intenta más tarde');
          this.isLoading.set(false);
        },
      });
  }

  async startFlowSesion() {
    try {
      const response = await this.authService.signIn(this.emailValue, this.passwordData!.password);
      if (response !== undefined) {
        this.storageService.setItem(
          'email',
          await this.cryptoService.encryptAsync(this.emailValue.toString()),
        );
        switch (response.nextStep.signInStep) {
          case 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED':
            alert('Debes cambiar la contraseña');
            this.arePasswordValid = false;
            this.currentStateEmitter.emit('NEW_PASSWORD_REQUIRED');
            break;
          case 'CONTINUE_SIGN_IN_WITH_TOTP_SETUP':
            this.qrInscriptionEmitter.emit(response.nextStep.totpSetupDetails.sharedSecret);
            this.currentStateEmitter.emit('VIEW QR');
            break;
          case 'CONFIRM_SIGN_IN_WITH_TOTP_CODE':
            this.currentStateEmitter.emit('SEND TOTP CODE');
            break;
        }
      } else {
        console.error('Error en la respuesta de signIn: ', response);
      }
    } catch (error) {
      console.error('Error en el flujo de inicio de sesión: ', error);
      this.authService.signOut().catch((signOutError) => {
        console.error('Error al cerrar sesión:', signOutError);
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  forgotPassword(): void {
    this.patientNtService
      .validateSesStatus(this.emailValue)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (status: ValidateSesStatusResponse) => {
          switch (status) {
            case 'Email_verificado':
              this.authService.handleResetPassword(this.emailValue).then((response) => {
                if (response.status === 'correct') {
                  this.router.navigate(['change-password']);
                } else {
                  alert('Error interno intenta mas tarde');
                }
              });
              break;
            case 'Validacion_reenviada':
              alert(
                'Se ha enviado una validación al correo electrónico, por favor aceptala y reinicia el proceso',
              );
              break;
            default:
              alert('Error interno.');
              break;
          }
        },
        error: (error: unknown) => {
          console.error('Error al validar el estado de registro en ses:', error);
          alert('Error interno, intenta más tarde');
        },
      });
  }
}
