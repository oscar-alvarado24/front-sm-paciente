import { Injectable } from '@angular/core';
import { SessionService } from '../session/service/session.service';
import { StorageService } from '../../../commons/service/localStotarage/local-storage.service';
import { GetIpService } from '../get-ip/service/get-ip.service';
import { catchError, map, retry, switchMap, timeout } from 'rxjs/operators';
import { Ip } from '../get-ip/interface/ip';
import { CryptoService } from '../../../commons/service/crypto/crypto.service';
import { Observable } from 'rxjs/internal/Observable';
import { from, of, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GetAndSaveSessionService {

  constructor(
    private readonly sessionService: SessionService,
    private readonly storageService: StorageService,
    private readonly getIpService: GetIpService,
    private readonly cryptoService: CryptoService
  ) { }

  startFlowForSession(): Observable<any> {
  return from(this.cryptoService.encryptAsync(this.storageService.getItem("email"), 'post')).pipe(
    switchMap((encryptedEmail: string) => 
      this.sessionService.getLastSession(encryptedEmail)
    ),
    switchMap(() => this.getIpService.getIPFromIpify()),
    switchMap((ip: Ip) => 
      from (this.cryptoService.encryptAsync(this.storageService.getItem("email"), 'post')).pipe(
        switchMap((encryptedEmail: string) =>
          this.sessionService.saveSession(encryptedEmail, ip.ip)
        )
      )
    ),
    map(() => ({complete: true})),
    timeout(30000),
    retry(2),
    catchError(error => {
      console.error('Error en startFlowForSession:', error);
      return throwError(() => new Error('Error al obtener la informacion de los doctores'));
    })
  );
}
}
