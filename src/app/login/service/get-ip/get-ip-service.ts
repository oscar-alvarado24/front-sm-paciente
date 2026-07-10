import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ip } from './model/ip';

@Injectable({ providedIn: 'root' })
export class GetIpService {
  private readonly http = inject(HttpClient);

  getIPFromIpify(): Observable<Ip> {
    return this.http.get<Ip>('https://api.ipify.org?format=json');
  }
}