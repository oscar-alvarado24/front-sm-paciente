import { Injectable } from '@angular/core';
import { BaseGraphqlService } from '../base/base-graphql';
import { BehaviorSubject, catchError, map, Observable, tap, throwError } from 'rxjs';
import { GET_PATIENT, SAVE_PHOTO } from './queries/queries';
import { GetPatientBasicResponse, SavePhotoResponse } from './model/responses';

@Injectable({
  providedIn: 'root',
})
export class PatientWtService extends BaseGraphqlService{
  protected override readonly serviceName = 'patient_wt';

  private readonly getPatientSubject = new BehaviorSubject<GetPatientBasicResponse ['getPatient']>(null);
  readonly getPatient$ = this.getPatientSubject.asObservable();

  private readonly savePhotoSubject = new BehaviorSubject<SavePhotoResponse['savePhoto']>(null);
  readonly savePhoto$ = this.savePhotoSubject.asObservable();

  constructor() {
    super();
    this.initClient();
  }

  getPatient(email: string): Observable<GetPatientBasicResponse['getPatient']> {
    console.log('Fetching patient data for email:', email);

    return this.query(GET_PATIENT, { email }).pipe(
      map((response) => response.getPatient),
      tap((patientData) => {
        if (!patientData) {
          console.warn('Paciente no encontrado en la respuesta');
          this.getPatientSubject.next(null);
          return;
        }
        console.log('Patient data received:', patientData);
        this.getPatientSubject.next(patientData);
      }),
      catchError((error) => {
        console.error('Error fetching patient:', error);
        this.getPatientSubject.next(null);
        return throwError(() => error);
      }),
    );
  }
  savePhoto(photo: string, email: string): Observable<SavePhotoResponse['savePhoto']> {
    console.log('Guardando foto del paciente');
    return this.mutate(SAVE_PHOTO, { email, photo }).pipe(
      map((response) => response.savePhoto),
      tap((photoData) => {
        this.savePhotoSubject.next(photoData);
      }),
    );
  }

  clearPatientState(): void {
    this.savePhotoSubject.next(null);
    this.getPatientSubject.next(null);
  }
}
