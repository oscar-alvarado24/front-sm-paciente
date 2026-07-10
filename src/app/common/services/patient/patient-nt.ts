import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { HttpHelperService } from '../http-helper/http-helper';
import { catchError, from, map, Observable, retry, switchMap, throwError, timeout } from 'rxjs';
import { PatientStatus, ValidateSesStatusResponse } from './model/response';
@Injectable({
  providedIn: 'root',
})
export class PatientNtService {
  private readonly baseUrl = environment.patient_nt_api_url;
  private readonly http = inject(HttpClient);
  private readonly httpHelper = inject(HttpHelperService);

  checkPatientStatus(email: string): Observable<PatientStatus> {
    return from(this.httpHelper.getCompleteHttpOptions({ email: email }, undefined, false)).pipe(
      switchMap((options) =>
        this.http
          .get<{ status: PatientStatus }>(`${this.baseUrl}/check-status`, options)
          .pipe(map((response) => response.status)),
      ),
      map((response) => {
        const status = response;
        if (!Object.values(PatientStatus).includes(status)) {
          throw new Error(`Valor de status inesperado del backend: ${status}`);
        }
        return status;
      }),
      timeout(30000),
      retry(2),
      catchError((error) => {
        console.error('Error en checkPatientStatus:', error);
        return throwError(() => new Error('Error al obtener la informacion del paciente'));
      }),
    );
  }

  validateSesStatus(email: string): Observable<ValidateSesStatusResponse> {
    return from(this.httpHelper.getCompleteHttpOptions({ email: email }, undefined, false)).pipe(
      switchMap((options) =>
        this.http
          .get<{
            status: ValidateSesStatusResponse;
          }>(`${this.baseUrl}/validate-ses-status`, options)
          .pipe(map((response) => response.status)),
      ),
      map((response) => {
        const status = response;
        if (!Object.values(ValidateSesStatusResponse).includes(status)) {
          throw new Error(`Valor de status inesperado del backend: ${status}`);
        }
        return status;
      }),
      timeout(30000),
      retry(2),
      catchError((error) => {
        console.error('Error en validateSesStatus:', error);
        return throwError(() => new Error('Error al obtener la informacion del paciente'));
      }),
    );
  }
}
