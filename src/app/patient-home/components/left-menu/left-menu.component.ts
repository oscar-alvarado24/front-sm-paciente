import { Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { PatientCtService } from '../../../commons/service/patient-ct/patient.service';
import { StorageService } from 'src/app/commons/service/localStotarage/local-storage.service';

@Component({
  selector: 'app-left-menu',
  templateUrl: './left-menu.component.html',
  styleUrls: ['./left-menu.component.css']
})
export class LeftMenuComponent {
  @Output() onPerfilClick = new EventEmitter<void>();
  @Output() onCambiarContraseñaClick = new EventEmitter<void>();
  @Output() onCerrarSesionClick = new EventEmitter<void>();
  @Output() onImagenCambio = new EventEmitter<string>();
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  email: string = this.storageService.getItem("email");
  imagenPerfil: string = this.storageService.getItem("photo");

  constructor(private readonly patientService: PatientCtService, private readonly storageService: StorageService) {
    this.patientService = patientService;
    console.log(this.imagenPerfil)
  }

  perfilClick(){
    console.log("")
  }

  cambiarContrasenaClick(): void {
    this.onCambiarContraseñaClick.emit();
  }

  cerrarSesionClick(): void {
    this.onCerrarSesionClick.emit();
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
}
