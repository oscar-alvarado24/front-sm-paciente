import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { BaseService } from '../base/base.service';
import { MultiApolloService } from '../multiApolo/multi-apollo.service';
import { 
  SAVE_PHOTO 
} from './patient-ct.queries';


@Injectable({
  providedIn: 'root'
})
export class PatientCtService extends BaseService {
  // Subjects para manejo de estado
  private readonly savePhotoResponseSubject = new BehaviorSubject<any>(null);
  savePhoto$ = this.savePhotoResponseSubject.asObservable();
 
  constructor(multiApollo: MultiApolloService) {
    super(multiApollo, 'patient_ct'); 
  }

  // Métodos para fotos
  savePhoto(photo: string, email: string): Observable<any> {
    console.log("Guardando foto del paciente");
    return this.mutate(SAVE_PHOTO, { email, photo }).pipe(
      tap(response => {
        this.savePhotoResponseSubject.next(response);
      })
    );
  }


  // Método para limpiar el estado del paciente
  clearPatientState(): void {
    this.savePhotoResponseSubject.next(null);
  }
}
