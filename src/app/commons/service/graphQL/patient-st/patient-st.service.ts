import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { BaseService } from '../base/base.service';
import { MultiApolloService } from '../multiApolo/multi-apollo.service';
import {
  GET_PATIENT,
  VALIDATE_SES_STATUS
} from './patient-st.queries';



@Injectable({
  providedIn: 'root'
})
export class PatientService extends BaseService {
  // Subjects para manejo de estado
  private readonly patientSubject = new BehaviorSubject<any>(null);
  patient$ = this.patientSubject.asObservable();
  private readonly sesStatusSubject = new BehaviorSubject<any>(null);
  sesStatus$ = this.sesStatusSubject.asObservable();

  constructor(multiApollo: MultiApolloService) {
    super(multiApollo, 'patient_st');
  }

  // Métodos para gestión de pacientes
  getPatient(email: string): Observable<any> {
  console.log("Fetching patient data for email:", email);
  
  // Especificar tipo de respuesta esperada
  return this.query<{ getPatient: any }>(GET_PATIENT, { email }).pipe(
    tap(response => {
      const patientData = response?.getPatient;
      
      if (!patientData) {
        console.warn("Paciente no encontrado en la respuesta");
        this.patientSubject.next(null);
        return;
      }
      
      console.log("Patient data received:", patientData);
      this.patientSubject.next(patientData);
    }),
    map(response => response?.getPatient),
    catchError(error => {
      console.error('Error fetching patient:', error);
      this.patientSubject.next(null);
      return throwError(() => error);
    })
  );
}

  validateSesStatus(email: string): Observable<string> {
    return this.query<{ validateStatusSesRegistration: string }>(VALIDATE_SES_STATUS, { email }).pipe(
      tap(response => {
        this.sesStatusSubject.next(response.validateStatusSesRegistration);
      }),
      map(response => response.validateStatusSesRegistration)
    );
  }

  // Método para limpiar el estado del paciente
  clearPatientState(): void {
    this.patientSubject.next(null);
  }
}
