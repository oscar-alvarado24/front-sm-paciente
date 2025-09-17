import { Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { PatientService } from '../../../commons/service/graphQL/patient-ct/patient-ct.service';
import { StorageService } from 'src/app/commons/service/localStotarage/local-storage.service';
import { SHARED_IMPORTS } from 'src/app/commons/shared-imports';
import { SessionResponse } from '../../interface/session-response';

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
  @Output() cerrarSesionClick = new EventEmitter<void>();
  @Output() imagenCambio = new EventEmitter<string>();
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  email: string = '';
  imagenPerfil: string = '';
  sessionInfo: SessionResponse |null = null;
  sessionValue: SessionResponse | string | null = null;

  constructor(private readonly patientService: PatientService, 
    private readonly storageService: StorageService) {
    this.patientService = patientService;
    this.storageService = storageService;
    
  }

  ngOnInit(): void {
    this.email = this.storageService.getItem("email");
    this.imagenPerfil = this.storageService.getItem("photo");
    this.sessionValue = this.storageService.getItem('session');
    console.log('sessionValue:', this.sessionValue);
    if (this.sessionValue && typeof this.sessionValue === 'object') {
      console.log('sessionValue es un objeto:');
      this.sessionInfo = this.sessionValue ;
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
          next: (result) => {
            console.log('Foto guardada con éxito:', result);
            // Aquí puedes manejar la respuesta exitosa
          },
          error: (error) => {
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
  logOut() {
    this.cerrarSesionClick.emit();
  }
}
