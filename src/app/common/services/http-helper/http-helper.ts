import { inject, Injectable } from '@angular/core';
import { HttpHeaders, HttpParams } from '@angular/common/http';
import { CustomHeaders } from './interface/custom-headers';
import { HttpOptions } from './interface/http-options';
import { CryptoService } from '../crypto/crypto';
import { AuthService } from '../auth/auth';

@Injectable({
  providedIn: 'root'
})
export class HttpHelperService {

  private readonly cryptoService = inject(CryptoService);
  private readonly authService = inject(AuthService);

  /**
   * Genera las opciones HTTP con headers comunes
   * @param additionalHeaders Headers adicionales a incluir
   * @param includeAuth Si debe incluir el token de autorización
   * @returns Objeto con las opciones HTTP configuradas
   */
  async getHttpOptions(
    additionalHeaders?: CustomHeaders,
    includeAuth= true
  ): Promise<HttpOptions> {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    if (includeAuth) {
      const token = await this.authService.getAccessToken();
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }

    if (additionalHeaders) {
      Object.keys(additionalHeaders).forEach(key => {
        const value = additionalHeaders[key];
        if (value !== undefined) {
          headers = headers.set(key, value);
        }
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
    params?: Record<string, unknown>,
    headers?: CustomHeaders,
    includeAuth = true
  ): Promise<HttpOptions> {
    const options: HttpOptions = await this.getHttpOptions(headers, includeAuth);

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
  private async createHttpParams(params: Record<string, unknown>): Promise<HttpParams> {
    let httpParams = new HttpParams();

    for (const [key, value] of Object.entries(params)) {
      if (!this.isParamValid(value)) {
        continue;
      }

      if (Array.isArray(value)) {
        for (const item of value) {
          const encoded = await this.encryptAndEncodeParam(item);
          httpParams = httpParams.append(key, encoded);
        }

        continue;
      }

      const encoded = await this.encryptAndEncodeParam(value);
      httpParams = httpParams.set(key, encoded);
    }

    return httpParams;
  }

  private isParamValid(value: unknown): boolean {
    return value !== null && value !== undefined && value !== '';
  }

  private async encryptAndEncodeParam(value: unknown): Promise<string> {
    console.debug('🔒 Encriptando y codificando parámetro:', value);
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    const encryption = await this.cryptoService.encryptAsync(stringValue, 'backend');
    return encodeURIComponent(encryption);
  }
}