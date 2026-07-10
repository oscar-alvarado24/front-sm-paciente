import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, of, tap, throwError } from 'rxjs';
import { HttpHelperService } from '../../../common/services/http-helper/http-helper';
import { LocalStorageService } from '../../../common/services/local-storage/local-storage';
import { environment } from '../../../../environments/environment';
import { SessionResponse } from './model/session-response';
import { Location } from './model/location';  


@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly http          = inject(HttpClient);
  private readonly httpHelper    = inject(HttpHelperService);
  private readonly storageService = inject(LocalStorageService);

  getLastSession(email: string): Observable<SessionResponse | null> {
    return this.http.post<SessionResponse>(environment.url_get_session, { email }).pipe(
      tap(sessionInfo => this.storageService.setItem('session', sessionInfo)),
      catchError(error => {
        console.error('Error al obtener sesión:', error);
        if (error.status === 404) {
          console.log('No se encontró sesión para este usuario');
          this.storageService.setItem('session', 'Este es el primer ingreso');
          return of(null);
        }
        return throwError(() => error);
      })
    );
  }

  saveSession(email: string, ip: string, location: Location): Observable<void> {
    const session = JSON.stringify({
      email,
      ip,
      city:      location.city,
      country:   location.country,
      localtime: location.localtime,
      timezone:  location.timezone,
      latitude:  location.latitude,
      longitude: location.longitude,
    });

    return this.http.post<void>(environment.url_save_session, session).pipe(
      tap(() => console.log('✅ Sesión guardada exitosamente')),
      catchError(error => {
        console.error('❌ Error al guardar la sesión:', error);
        return throwError(() => error);
      })
    );
  }
}