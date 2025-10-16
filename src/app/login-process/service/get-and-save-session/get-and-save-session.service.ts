import { Injectable } from '@angular/core';
import { SessionService } from '../session/service/session.service';
import { StorageService } from '../../../commons/service/localStotarage/local-storage.service';
import { GetIpService } from '../get-ip/service/get-ip.service';
import { map, switchMap } from 'rxjs/operators';
import { Ip } from '../get-ip/interface/ip';
import { Encrypt } from '../../../commons/class/encrypt';
import { Observable } from 'rxjs/internal/Observable';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GetAndSaveSessionService {

  constructor(
    private readonly sessionService: SessionService,
    private readonly storageService: StorageService,
    private readonly getIpService: GetIpService
  ) {
    this.sessionService = sessionService
    this.storageService = storageService
    this.getIpService = getIpService
  }

  startFlowForSession(): Observable<any>{
    return this.sessionService.getLastSession(Encrypt.decryptParam(this.storageService.getItem("email")))
      .pipe(
        switchMap(() => {
          return this.getIpService.getIPFromIpify();
        }),
        switchMap((ip: Ip) => {
          return this.sessionService.saveSession(
            Encrypt.decryptParam(this.storageService.getItem("email")),
            ip.ip
          ).pipe(
            map(() => {return of({complete:true})})
          );
        })
      )
  }
}
