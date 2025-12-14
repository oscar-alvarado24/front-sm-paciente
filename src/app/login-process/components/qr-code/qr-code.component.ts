import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges, OnChanges } from '@angular/core';
import * as QRCode from 'qrcode';
import { AuthService } from '../../../commons/service/auth/auth.service';
import { StorageService } from '../../../commons/service/localStotarage/local-storage.service';
import { CryptoService } from '../../../commons/service/crypto/crypto.service';

@Component({
  selector: 'app-qr-code',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './qr-code.component.html',
  styleUrls: ['./qr-code.component.css']
})
export class QrCodeComponent implements OnChanges {

  @Output() currentStateEmitter = new EventEmitter<string>();
  @Input() sharedSecret: string = "";

  /** URL del código QR para configuración MFA */
  qrCodeUrl: string = "";

  /** Imagen del código QR generada como base64 */
  qrCodeImage: string = "";

  constructor(
    private readonly authService: AuthService,
    private readonly storageService: StorageService,
    private readonly cryptoService: CryptoService
  ) {}

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
   * @description Configura la inscripción MFA generando el código QR
   * @param sharedSecret Secreto compartido para generar el código QR
   */
  ngOnChanges(changes: SimpleChanges) {
    if (changes['sharedSecret']) {
      this.enableToptAndshowQrCode(changes['sharedSecret'].currentValue);
    }
  }

  private async enableToptAndshowQrCode(sharedSecret: string) {
    this.authService.enableTOTP(await this.cryptoService.decryptAsync(this.storageService.getItem('email')), sharedSecret);

    this.qrCodeUrl = this.authService.qrCodeUrl;
    // Generar la imagen del QR code
    await this.generateQRCode(this.qrCodeUrl);
    this.currentStateEmitter.emit("VIEW QR");
  }
}
