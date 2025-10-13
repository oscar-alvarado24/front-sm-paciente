import { Injectable } from '@angular/core';
import { CustomHeaders } from '../interface/custom-headers';
import { HttpOptions } from '../interface/http-options';
import { HttpHeaders, HttpParams } from '@angular/common/http';
import { CognitoTokenHelper } from '../class/cognito-token-helper';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HttpHelperService {

  constructor() { }
  private readonly secretKey = environment.secretKey;
  
  private encryptParam(value: string): string {
    const encrypted = CryptoJS.AES.encrypt(value, this.secretKey).toString();
    return encodeURIComponent(encrypted);
  }
  /**
   * Genera las opciones HTTP con headers comunes
   * @param additionalHeaders Headers adicionales a incluir
   * @param includeAuth Si debe incluir el token de autorización
   * @returns Objeto con las opciones HTTP configuradas
   */
  getHttpOptions(
    additionalHeaders?: CustomHeaders,
    includeAuth: boolean = true
  ): HttpOptions {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    // Agregar token de autorización si existe y se solicita
    if (includeAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }

    // Agregar headers adicionales
    if (additionalHeaders) {
      Object.keys(additionalHeaders).forEach(key => {
        headers = headers.set(key, additionalHeaders[key]);
      });
    }

    return { headers };
  }

  /**
   * Genera opciones HTTP completas con parámetros y headers
   * @param params Parámetros de query
   * @param headers Headers adicionales
   * @param includeAuth Si incluir autorización
   * @returns Opciones HTTP completas
   */
  getCompleteHttpOptions(
    params?: { [key: string]: any },
    headers?: CustomHeaders,
    includeAuth: boolean = true,
    encryptParams: boolean = true
  ): HttpOptions {
    const options: HttpOptions = this.getHttpOptions(headers, includeAuth);

    if (params) {
      options.params = this.createHttpParams(params, encryptParams);
    }

    return options;
  }
  
  /**
   * Crea parámetros HTTP desde un objeto
   * @param params Objeto con los parámetros
   * @returns HttpParams configurado
   */
  private createHttpParams(params: { [key: string]: any }, encrypt: boolean): HttpParams {
    let httpParams = new HttpParams();

    Object.keys(params).forEach(key => {
      const value = params[key];
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          // Para arrays, agregar múltiples parámetros con la misma clave
          value.forEach(item => {
            httpParams = httpParams.append(key, encrypt ? this.encryptParam(item.toString()) : item.toString());
          });
        } else {
          httpParams = httpParams.set(key, encrypt ? this.encryptParam(value.toString()) : value.toString());
        }
      }
    });

    return httpParams;
  }

  /**
   * Obtiene el token de autorización del almacenamiento
   * @returns Token de autorización o null
   */
  private getAuthToken(): string | null {
    // Usar el helper de Cognito para obtener el token
    return CognitoTokenHelper.getAccessToken();
  }

}
