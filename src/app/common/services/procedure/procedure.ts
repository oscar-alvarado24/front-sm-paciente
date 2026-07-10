import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { HttpHelperService } from '../http-helper/http-helper';
import {
  Observable,
  from,
  switchMap,
  timeout,
  retry,
  throwError,
  catchError,
} from 'rxjs';
import { MedicalProcedure } from './interface/medical-procedure';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProcedureService {
  private readonly https = inject(HttpClient);
  private readonly httpHelper = inject(HttpHelperService);
  private readonly baseUrl = environment.procedure_api_url;

  getProceduresByPatientId(patient: string): Observable<MedicalProcedure[]> {
    return from(this.httpHelper.getCompleteHttpOptions({ patient })).pipe(
      switchMap((options) =>
        this.https.get<MedicalProcedure[]>(
          `${this.baseUrl}/get-procedure-by-patient/front-version`,
          options,
        ),
      ),
      timeout(30000),
      catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status >= 400 && error.status <= 409) {
        return throwError(() => error);
      }
      throw error;
    }),
    retry({ count: 2, delay: 1000 })
  );
  }
}