import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, from, switchMap, timeout, catchError, throwError, retry } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { HttpHelperService } from '../http-helper/http-helper';
import { Branch } from './interface/branch';

@Injectable({
  providedIn: 'root',
})
export class ProviderService {
  private readonly https = inject(HttpClient);
  private readonly httpHelper = inject(HttpHelperService);
  private readonly baseUrl = environment.provider_api_url;

  getBranchesByIds(keys: string[]): Observable<Branch[]> {
    const params = { keys: keys.join(',') };

    return from(this.httpHelper.getCompleteHttpOptions(params)).pipe(
      switchMap((options) => this.https.get<Branch[]>(`${this.baseUrl}/branches`, options)),
      timeout(30000),
      catchError((error) => {
        // ✅ No reintentar si es error 400–409
        if (error instanceof HttpErrorResponse && error.status >= 400 && error.status <= 409) {
          return throwError(() => error);
        }
        throw error;
      }),
      retry({ count: 2, delay: 1000 }), // reintentará hasta 2 veces (solo si no fue 400–409)
    );
  }
}
