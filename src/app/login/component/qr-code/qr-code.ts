import { Component, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { AuthService } from '../../../common/services/auth/auth';
import { CryptoService } from '../../../common/services/crypto/crypto';
import { LocalStorageService } from '../../../common/services/local-storage/local-storage';
import { QRCodeComponent, QRCodeElementType, QRCodeErrorCorrectionLevel } from 'angularx-qrcode';
import { SHARED_IMPORTS } from '../../../common/shared-imports';


@Component({
  selector: 'app-qr-code',
  imports: [SHARED_IMPORTS, QRCodeComponent],
  templateUrl: './qr-code.html',
  styleUrl: './qr-code.scss',
})
export class QrCode implements OnChanges {
  @Output() currentStateEmitter = new EventEmitter<string>();
  @Input() sharedSecret = '';
  qrUrl = '';

  private readonly authService = inject(AuthService);
  private readonly storageService = inject(LocalStorageService);
  private readonly cryptoService = inject(CryptoService);

  ngOnChanges(changes: SimpleChanges): void {
    const secret = changes['sharedSecret']?.currentValue as string;
    if (secret?.trim()) {
      void this.enableTotpAndShowQrCode(secret.trim());
    }
  }

  /**
   * Configura la inscripción MFA generando el código QR.
   */
  private async enableTotpAndShowQrCode(sharedSecret: string): Promise<void> {
    const email = await this.cryptoService.decryptAsync(this.storageService.getItem('email') || '');
    this.qrUrl = await this.authService.enableTOTP(email, sharedSecret);
    this.currentStateEmitter.emit('VIEW QR');
  }

  qrCodeConfig = {
        elementType: 'canvas' as QRCodeElementType,
        errorCorrectionLevel: 'M' as QRCodeErrorCorrectionLevel,
        margin: 2,
        scale: 4,
        width: 160, // 👈 reducido de 300 a 160
        colorDark: '#000000',
        colorLight: '#FFFFFF',
    };
}

