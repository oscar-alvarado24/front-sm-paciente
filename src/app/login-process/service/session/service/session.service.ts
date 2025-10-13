import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, tap, throwError, of } from 'rxjs';
import { SessionResponse } from '../interface/session-response';
import { environment } from 'src/environments/environment';
import { StorageService } from 'src/app/commons/service/localStotarage/local-storage.service';


@Injectable({
  providedIn: 'root'
})
export class SessionService {

  constructor(private readonly https: HttpClient,private readonly storageService: StorageService) { }

  getLastSession(email: string): Observable<SessionResponse | null> {
    const requestBody = { email: email };
    return this.https.post<SessionResponse>(
      environment.url_get_session,
      requestBody
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
}