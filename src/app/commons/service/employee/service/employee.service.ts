import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, retry, tap, timeout } from 'rxjs';
import { HttpHelperService } from '../../http-helper/service/http-helper.service';
import { Doctor } from '../interface/employee';


@Injectable({
  providedIn: 'root'
})
export class EmployeeService {

  private readonly baseUrl = environment.employee_api_url;

  constructor(
    private readonly http: HttpClient,
    private readonly httpHelper: HttpHelperService
  ) {
    this.httpHelper = httpHelper;
    this.http = http;
    }
  
  getDoctorByIds(doctorsId: number[]): Observable<Doctor[]> {
    const params = { 'ids': doctorsId.join(',') };
    const options = this.httpHelper.getCompleteHttpOptions(params);
    return this.http.get<Doctor[]>(`${this.baseUrl}/doctors/by-id-list`, options)
      .pipe(
        tap(data => console.log('getDoctorByIds data:', data)),
        timeout(30000),
        retry(2),
        //catchError(error => HandleProcedureError.handleProcedureError(error, `get-doctor-by-id`))
      );
  }
}
