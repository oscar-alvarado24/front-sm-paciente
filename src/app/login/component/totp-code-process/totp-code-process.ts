import { Component, EventEmitter, inject, Output } from '@angular/core';
import { AuthService } from '../../../common/services/auth/auth';
import { SHARED_IMPORTS } from '../../../common/shared-imports';
import { CodeTotp } from '../code-totp/code-totp';

@Component({
  selector: 'app-totp-code-process',
  imports: [SHARED_IMPORTS, CodeTotp],
  templateUrl: './totp-code-process.html',
  styleUrl: './totp-code-process.scss',
})
export class TotpCodeProcess {
  @Output() currentStateEmitter = new EventEmitter<string>();
  @Output() totpProcessSuccessfulEmitter = new EventEmitter<boolean>();

  private readonly authService = inject(AuthService);

  codeValue = '';
  isCodeValid = false;
  resetCode = false;

  onCodeValid(codeIsValid: boolean): void {
    this.isCodeValid = codeIsValid;
  }

  onCodeValue(code: string): void {
    this.codeValue = code;
  }

  private clearCode(): void {
    this.resetCode = true;
    setTimeout(() => (this.resetCode = false), 0);
  }

  async sendTotp(): Promise<void> {
    if (!this.isCodeValid) return;

    const response = await this.authService.confirmTotpCode(this.codeValue);

    if (response === undefined) {
      console.error('Error al confirmar el código TOTP');
      this.clearCode();
    } else if (response.nextStep.signInStep === 'DONE') {
      this.totpProcessSuccessfulEmitter.emit(true);
    } else {
      alert(
        'Tiempo de sesión expirado, debes iniciar el proceso de registro de la aplicación de nuevo',
      );
      this.currentStateEmitter.emit('INITIAL');
    }
  }
}
