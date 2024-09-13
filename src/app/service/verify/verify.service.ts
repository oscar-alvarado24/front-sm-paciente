import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ResponseVerify } from 'src/app/model/response-verify';

@Injectable({
  providedIn: 'root'
})
export class VerifyService {
  private apiUrl = 'http://localhost:8090/verify/';

  constructor(private http: HttpClient) { }

  generateCode<T>(data: any): Observable<ResponseVerify> {
    const url = `${this.apiUrl}generate`;
    const headers = new HttpHeaders().set('Content-Type', 'application/json');

    return this.http.post<ResponseVerify>(url, data, { headers }).pipe(
      tap(response => {
        console.log('Respuesta completa:', response);
        console.log('Status:', response.status);
        console.log('Mensaje:', response.message);
        console.log('Cuerpo de la respuesta:', response.body);
      })
    );
  }

  validateCode<T>(data: any): Observable<ResponseVerify> {
    const url = `${this.apiUrl}validate`;
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this.http.post<ResponseVerify>(url, data, { headers }).pipe(
      tap(response => {
        console.log('Respuesta completa:', response);
        console.log('Status:', response.status);
        console.log('Mensaje:', response.message);
        console.log('Cuerpo de la respuesta:', response.body);
      })
    );
  }
}
