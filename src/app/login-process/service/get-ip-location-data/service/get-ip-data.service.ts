import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GetIpDataService {

  constructor(private readonly https: HttpClient) { }

  getIpLocationData<IpData>(ip: string) {
    return this.https.get<IpData>(`https://api.ipquery.io/${ip}`);
  }
}
