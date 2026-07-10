import { Component, ElementRef, EventEmitter, inject, OnInit, Output, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../common/services/auth/auth';
import { CryptoService } from '../../../common/services/crypto/crypto';
import { SessionResponse } from '../../../login/service/session/model/session-response';
import { PatientWtService } from '../../../common/services/graphql/services/patient-wt';
import { LocalStorageService } from '../../../common/services/local-storage/local-storage';

@Component({
  selector: 'app-left-menu',
  imports: [],
  templateUrl: './left-menu.html',
  styleUrl: './left-menu.scss',
})
export class LeftMenu implements OnInit {
  @Output() perfilClick = new EventEmitter<void>();
  @Output() cambiarContraseñaClick = new EventEmitter<void>();
  @Output() imagenCambio = new EventEmitter<string>();
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private readonly patientService = inject(PatientWtService);
  private readonly storageService = inject(LocalStorageService);
  private readonly cryptoService = inject(CryptoService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  email = '';
  imagenPerfil = '';
  sessionInfo: SessionResponse | null = null;
  sessionValue: SessionResponse | string | null = null;

  ngOnInit(): void {
    void this.loadSessionData();
  }

  private async loadSessionData(): Promise<void> {
    const emailSaved = this.storageService.getItem('email');
    if (typeof emailSaved === 'string') {
      this.email = await this.cryptoService.decryptAsync(emailSaved);
    } else {
      this.email = '';
    }

    const imageSaved = this.storageService.getItem('photo');
    if (typeof imageSaved === 'string' && imageSaved.length > 5) {
      this.imagenPerfil = await this.cryptoService.decryptAsync(imageSaved);
    }

    const sessionRaw = this.storageService.getItem('session');
    this.sessionValue = sessionRaw as SessionResponse | string | null;

    if (sessionRaw && typeof sessionRaw === 'object') {
      const session = sessionRaw as SessionResponse;
      this.sessionInfo = {
        city: session.city,
        connectionTime: session.connectionTime,
        country: await this.cryptoService.decryptAsync(session.country ?? ''),
        email: this.email,
        ip: await this.cryptoService.decryptAsync(session.ip ?? ''),
        latitude: await this.cryptoService.decryptAsync(session.latitude ?? ''),
        longitude: await this.cryptoService.decryptAsync(session.longitude ?? ''),
        timezone: session.timezone
      };
    }
  }

  seleccionarImagen(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target?.value && target.files && target.files.length > 0) {
      const file = target.files[0];
      if (!file) {
        return;
      }

      if (!/image.*/.exec(file.type)) {
        alert('Por favor selecciona un archivo de imagen');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no debe superar los 5MB');
        return;
      }

      this.processFile(file);
    }
  }

  async processFile(file: File): Promise<void> {
    try {
      const base64 = await this.convertToBase64Promise(file);
      this.imagenPerfil = base64;
      this.patientService.savePhoto(this.imagenPerfil, this.email).subscribe({
        next: (result: unknown) => {
          console.log('Foto guardada con éxito:', result);
        },
        error: (error: unknown) => {
          console.error('Error al guardar la foto:', error);
        }
      });
    } catch (error) {
      console.error('Error al convertir la imagen:', error);
    }
  }

  convertToBase64Promise(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => resolve(fileReader.result as string);
      fileReader.onerror = (error) => {
        console.error(error);
        reject(new Error((error?.target as FileReader)?.error?.message));
      };
    });
  }

  get date(): string {
    const fecha = new Date(this.sessionInfo?.connectionTime ?? Date.now());
    const fechaLocal = fecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const horaLocal = fecha.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    return `${fechaLocal} ${horaLocal}`;
  }

  get ip(): string {
    return this.sessionInfo?.ip ?? 'N/A';
  }

  get location(): string {
    const city = this.sessionInfo?.city ?? 'N/A';
    const country = this.sessionInfo?.country ?? 'N/A';
    return `${city} - ${country}`;
  }

  viewProfile(): void {
    this.perfilClick.emit();
  }

  changePassword(): void {
    this.cambiarContraseñaClick.emit();
  }

  async logOut(): Promise<void> {
    await this.authService.signOut();
    this.storageService.clear();
    this.router.navigate(['/login']);
  }
}
