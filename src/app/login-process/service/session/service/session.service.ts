import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, tap, throwError, of } from 'rxjs';
import { SessionResponse } from '../interface/session-response';
import { environment } from 'src/environments/environment';
import { StorageService } from 'src/app/commons/service/localStotarage/local-storage.service';
import { HttpHelperService } from '../../../../commons/service/http-helper/service/http-helper.service';


@Injectable({
  providedIn: 'root'
})
export class SessionService {

  constructor(
    private readonly https: HttpClient,
    private readonly httpHelper: HttpHelperService,
    private readonly storageService: StorageService) { }

  getLastSession(email: string): Observable<SessionResponse | null> {
    const body = { email: email };
    return this.https.post<SessionResponse>(
      environment.url_get_session,
      body
    ).pipe(
      tap((sessionInfo) =>  this.storageService.setItem('session', sessionInfo)),
      catchError((error) => {
        console.error('Error al obtener sesión de Lambda:', error);
        if (error.status === 404) {
          console.log('No se encontró sesión para este usuario');
          this.storageService.setItem('session', 'Este es el primer ingreso');
          return of(null);
        }
        return throwError(() => error);
      })
    );
  }

  saveSession(email: string, ip: string): Observable<any> {
    const session = JSON.stringify({ email: email, ip: ip });
    return this.https.post(environment.url_save_session, session)
    .pipe(
      tap((response) => {
        console.log('Sesión guardada exitosamente:', response);
      }),
      catchError((error) => {
        console.error('Error al guardar la sesión:', error);
        return throwError(() => error);
      })
    );
  }
}