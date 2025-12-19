import { Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { PatientCtService } from '../../../commons/service/graphQL/patient-ct/patient-ct.service';
import { StorageService } from 'src/app/commons/service/localStotarage/local-storage.service';
import { SHARED_IMPORTS } from 'src/app/commons/shared-imports';
import { SessionResponse } from '../../../login-process/service/session/interface/session-response';
import { CryptoService } from '../../../commons/service/crypto/crypto.service';
import { Router } from '@angular/router';
import { AuthService } from '../../../commons/service/auth/service/auth.service';

@Component({
  selector: 'app-left-menu',
  standalone: true,
  imports: [SHARED_IMPORTS],
  templateUrl: './left-menu.component.html',
  styleUrls: ['./left-menu.component.css']
})
export class LeftMenuComponent implements OnInit {
  @Output() perfilClick = new EventEmitter<void>();
  @Output() cambiarContraseñaClick = new EventEmitter<void>();
  @Output() imagenCambio = new EventEmitter<string>();
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  email: string = '';
  imagenPerfil: string = '';
  sessionInfo: SessionResponse |null = null;
  sessionValue: SessionResponse | string | null = null;

  constructor(
    private readonly patientService: PatientCtService,
    private readonly storageService: StorageService,
    private readonly cryptoService: CryptoService,
    private readonly router: Router,
    private readonly authService: AuthService
  )
    {}

  async ngOnInit(): Promise<void> {
    this.email = await this.cryptoService.decryptAsync(this.storageService.getItem("email"));
    const imageSaved= this.storageService.getItem("photo");
    if(imageSaved && imageSaved.length > 5){
      this.imagenPerfil = await this.cryptoService.decryptAsync(imageSaved);
    }
    this.sessionValue = this.storageService.getItem('session');
    console.log('sessionValue:', this.sessionValue);
    console.log('typeof sessionValue:', typeof this.sessionValue);
    if (this.sessionValue && typeof this.sessionValue === 'object') {
      this.sessionInfo = {
        city: this.sessionValue.city,
        connectionTime: this.sessionValue.connectionTime,
        country: await this.cryptoService.decryptAsync(this.sessionValue.country!),
        email: this.email,
        ip: await this.cryptoService.decryptAsync(this.sessionValue.ip!),
        latitude: await this.cryptoService.decryptAsync(this.sessionValue.latitude!),
        longitude: await this.cryptoService.decryptAsync(this.sessionValue.longitude!),
        timezone: this.sessionValue.timezone
      };
    }
  }



  seleccionarImagen(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target?.value && target.files && target.files.length > 0) {

      const file = target.files[0];

      // Verificar que sea una imagen
      if (!/image.*/.exec(file.type)) {
        alert('Por favor selecciona un archivo de imagen');
        return;
      }

      // Límite de tamaño (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no debe superar los 5MB');
        return;
      }
      this.processFile(file)
    }
  }

  async processFile(file: File) {
    try {
      const base64 = await this.convertToBase64Promise(file);
      this.imagenPerfil = base64;
      this.patientService.savePhoto(this.imagenPerfil, this.email)
        .subscribe({
          next: (result: any) => {
            console.log('Foto guardada con éxito:', result);
            // Aquí puedes manejar la respuesta exitosa
          },
          error: (error: any) => {
            console.error('Error al guardar la foto:', error);
            // Aquí puedes manejar el error
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
      fileReader.onload = () => {
        resolve(fileReader.result as string);
      };
      fileReader.onerror = (error) => {
        console.error(error)
        reject(new Error(error?.target?.error?.message));
      };
    });
  }

  get date(): string {
    const fecha: Date = new Date( this.sessionInfo?.connectionTime || Date.now());

    const fechaLocal: string = fecha.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    const horaLocal: string = fecha.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    return `${fechaLocal} ${horaLocal}`;
  }

  get ip(): string {
    return this.sessionInfo?.ip || 'N/A';
  }

  get location(): string {
    const city = this.sessionInfo?.city || 'N/A';
    const country = this.sessionInfo?.country || 'N/A';
    return `${city} - ${country}`;
  }

  viewProfile() {
    this.perfilClick.emit();
  }

  changePassword() {
    this.cambiarContraseñaClick.emit();
  }

  async logOut() {
    await this.authService.signOut();
    this.storageService.clear();
    this.router.navigate(['/login']);
  }
}
