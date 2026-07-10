import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { catchError, from, Observable, retry, switchMap, tap, throwError, timeout } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { HttpHelperService } from '../http-helper/http-helper';
import { Doctor } from './interface/employees';

@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  private readonly baseUrl = environment.employee_api_url;
  private readonly http = inject(HttpClient);
  private readonly httpHelper = inject(HttpHelperService);


  getDoctorByIds(doctorsId: number[]): Observable<Doctor[]> {
    const params = { 'ids': doctorsId.join(',') };
    return from (this.httpHelper.getCompleteHttpOptions(params))
      .pipe(
        switchMap(options =>
          this.http.get<Doctor[]>(`${this.baseUrl}/doctors/by-id-list`, options)
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
