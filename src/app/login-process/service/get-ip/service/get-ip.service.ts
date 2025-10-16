import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Ip } from '../interface/ip';

@Injectable({
  providedIn: 'root'
})
export class GetIpService {

  constructor(private readonly https: HttpClient) {}

  
  getIPFromIpify() {
    return this.https.get<Ip>('https://api.ipify.org?format=json');
  }
}
