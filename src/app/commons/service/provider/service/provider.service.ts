import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { catchError, from, Observable, retry, switchMap, throwError, timeout } from 'rxjs';
import { HttpHelperService } from '../../http-helper/service/http-helper.service';
import { BranchRequest } from '../interface/branch-request';
import { Branch } from '../interface/provider';


@Injectable({
  providedIn: 'root'
})
export class ProviderService {

  private readonly baseUrl = environment.provider_api_url;

  constructor(
    private readonly https: HttpClient,
    private readonly httpHelper: HttpHelperService
  ) {}

   getBranchesByIds(keys: string[]): Observable<Branch[]> {
    const params = { 'keys': keys.join(',') };
    
    return from(this.httpHelper.getCompleteHttpOptions(params))
      .pipe(
        switchMap(options =>
          this.https.get<Branch[]>(`${this.baseUrl}/branches`, options)
        ),
        timeout(30000),
        retry(2),
        catchError(error => {
          console.error('Error en getBranchesByIds:', error);
          return throwError(() => new Error('Error al obtener branches'));
        })
      );
  }
}