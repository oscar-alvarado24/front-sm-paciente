import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { catchError, from, Observable, retry, switchMap, timeout } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { HttpHelperService } from '../../http-helper/service/http-helper.service';
import { MedicalProcedure } from '../interface/medical-procedure';
import { HandleProcedureError } from '../class/handle-procedure-error';

@Injectable({
  providedIn: 'root'
})
export class ProcedureService {

  private readonly baseUrl = environment.procedure_api_url;

  constructor(
    private readonly https: HttpClient,
    private readonly httpHelper: HttpHelperService
  ) { }

  getProceduresByPatientId(patient: string): Observable<MedicalProcedure[]> {
    return from(this.httpHelper.getCompleteHttpOptions({ 'patient':patient }))
      .pipe(
        switchMap(options =>
          this.https.get<MedicalProcedure[]>(
            `${this.baseUrl}/get-procedure-by-patient/front-version`,
            options
          )
        ),
        timeout(30000),
        retry(2),
      );
  }
}
