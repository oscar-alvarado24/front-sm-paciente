import { Injectable } from '@angular/core';
import { CustomHeaders } from '../interface/custom-headers';
import { HttpOptions } from '../interface/http-options';
import { HttpHeaders, HttpParams } from '@angular/common/http';
import { CognitoTokenHelper } from '../class/cognito-token-helper';
import { CryptoService } from '../../crypto/crypto.service';

@Injectable({
  providedIn: 'root'
})
export class HttpHelperService {

  constructor(
    private readonly cryptoService:CryptoService
  ) { }
  
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
   async getCompleteHttpOptions(
    params?: { [key: string]: any },
    headers?: CustomHeaders,
    includeAuth: boolean = true
  ): Promise<HttpOptions> {
    const options: HttpOptions = this.getHttpOptions(headers, includeAuth);

    if (params) {
      options.params = await this.createHttpParams(params);
    }

    return options;
  }
  
  /**
   * Crea parámetros HTTP desde un objeto
   * @param params Objeto con los parámetros
   * @returns HttpParams configurado
   */
  private async createHttpParams(params: { [key: string]: any }): Promise<HttpParams> {
  let httpParams = new HttpParams();

  for (const key of Object.keys(params)) {
    const value = params[key];
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        for (const item of value) {
          const encryption = await this.cryptoService.encryptAsync(item.toString(),'get');
          const encode = encodeURIComponent(encryption);
          httpParams = httpParams.append(key, encode);
        }
      } else {
        const encryption = await this.cryptoService.encryptAsync(value.toString(),'get');
        const encode = encodeURIComponent(encryption);
        httpParams = httpParams.set(key, encode);
      }
    }
  }

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
