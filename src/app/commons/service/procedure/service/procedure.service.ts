import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { catchError, Observable, retry, timeout } from 'rxjs';
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
    private readonly http: HttpClient,
    private readonly httpHelper: HttpHelperService
  ) {
    this.httpHelper = httpHelper;
    this.http = http;
   }

  getProceduresByPatientId(patientId: number, request_type: string, size: number = 10): Observable<MedicalProcedure[]> {

    const params = { 'request-type': request_type, limit: size.toString() };
    const options = this.httpHelper.getCompleteHttpOptions(params);
    return this.http.get<MedicalProcedure[]>(
      `${this.baseUrl}/get-procedure-by-patient/${patientId}`,
      options
    ).pipe(
      timeout(30000),
      retry(2),
      catchError(error => HandleProcedureError.handleProcedureError(error, `get-procedure-patient-${patientId}`))
    );
  }

  

  
}
