import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { catchError, from, Observable, retry, switchMap, tap, throwError, timeout } from 'rxjs';
import { HttpHelperService } from '../../http-helper/service/http-helper.service';
import { Doctor } from '../interface/employee';


@Injectable({
  providedIn: 'root'
})
export class EmployeeService {

  private readonly baseUrl = environment.employee_api_url;

  constructor(
    private readonly https: HttpClient,
    private readonly httpHelper: HttpHelperService
  ) { }

  getDoctorByIds(doctorsId: number[]): Observable<Doctor[]> {
    const params = { 'ids': doctorsId.join(',') };
    return from (this.httpHelper.getCompleteHttpOptions(params))
      .pipe(
        switchMap(options =>
          this.https.get<Doctor[]>(`${this.baseUrl}/doctors/by-id-list`, options)
        ),
        tap(data => console.log('getDoctorByIds data:', data)),
        timeout(30000),
        retry(2),
        catchError(error => {
          console.error('Error en getDoctorByIds:', error);
          return throwError(() => new Error('Error al obtener la informacion de los doctores'));
        })
      );
  }
}
