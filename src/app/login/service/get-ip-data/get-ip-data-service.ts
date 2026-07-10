import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GetIpDataService {
  private readonly http = inject(HttpClient);

  getIpLocationData<IpData>(ip: string): Observable<IpData> {
    return this.http.get<IpData>(`https://api.ipquery.io/${ip}`);
  }
}