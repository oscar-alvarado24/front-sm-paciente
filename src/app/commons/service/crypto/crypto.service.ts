import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CryptoService {
  private secretKey: string
  private isKeyValidated: boolean = false;
  private readonly ENCRYPTION_PREFIX = 'ENC:';

  constructor(

  ) {
    this.secretKey = environment.secretKey
  }



  async encryptAsync(data: string, destiny: string = 'local'): Promise<string> {

    if (destiny === 'local_encrypt') {
      return this.ENCRYPTION_PREFIX + data;
    }
    
    if (data.startsWith(this.ENCRYPTION_PREFIX)) {
      let dataToEncrypt = data.substring(this.ENCRYPTION_PREFIX.length);
      return dataToEncrypt;
    }

    // Validar clave (debe ser base64 como en tu Java)
    this.validateKey(this.secretKey);

    // Convertir clave base64 a ArrayBuffer
    const keyBytes = Uint8Array.from(atob(this.secretKey), c => c.charCodeAt(0));

    // Importar clave directamente (sin PBKDF2)
    const key = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      {
        name: 'AES-GCM',
        length: 256
      },
      false,
      ['encrypt', 'decrypt']
    );

    // Generar IV aleatorio (12 bytes para GCM)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Convertir datos a ArrayBuffer
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    // Encriptar
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128
      },
      key,
      dataBuffer
    );

    // Combinar IV + datos encriptados (sin salt)
    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedBuffer), iv.length);

    const dataEncripted = this.uint8ArrayToBase64(combined);

    return destiny === 'local' ? this.ENCRYPTION_PREFIX + dataEncripted : dataEncripted;
  }


  async decryptAsync(encryptedData: string): Promise<string> {
    try {

      let dataToDecrypt = encryptedData;
      if (encryptedData.startsWith(this.ENCRYPTION_PREFIX)) {
        dataToDecrypt = encryptedData.substring(this.ENCRYPTION_PREFIX.length);
      }
      // Convertir clave base64 a ArrayBuffer
      const keyBytes = Uint8Array.from(atob(this.secretKey), c => c.charCodeAt(0));

      // Importar clave
      const key = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        {
          name: 'AES-GCM',
          length: 256
        },
        false,
        ['decrypt']
      );

      // Convertir datos de base64
      const encryptedBuffer = this.base64ToUint8Array(dataToDecrypt);
      // Extraer IV (primeros 12 bytes) y datos
      const iv = encryptedBuffer.slice(0, 12);
      const data = encryptedBuffer.slice(12);

      // Desencriptar
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
          tagLength: 128
        },
        key,
        data
      );

      // Convertir a string
      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      console.error('Error al desencriptar:', error);
      throw new Error('Error al desencriptar: clave incorrecta o datos corruptos');
    }
  }

  private validateKey(secretKey: string): void {
    // Verificar que sea base64 válido y de 32 bytes (256 bits)
    try {
      if (!this.isKeyValidated) {
        const keyBytes = Uint8Array.from(atob(secretKey), c => c.charCodeAt(0));
        if (keyBytes.length !== 32) {
          console.error('Invalid key length:', keyBytes.length);
          throw new Error('La clave debe ser base64 de 32 bytes (256 bits)');
        }
        this.isKeyValidated = true
      } else {
        return
      }
    } catch (e) {
      console.log('Error validating key:', e);
      throw new Error('La clave debe ser un base64 válido');
    }
  }

  private uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = '';
    const chunkSize = 0x8000;

    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, chunk as any);
    }

    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private base64ToUint8Array(base64: string): Uint8Array {
    let standardBase64 = base64
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    // Restaurar padding
    while (standardBase64.length % 4) {
      standardBase64 += '=';
    }
    const binaryString = atob(standardBase64);
    const bytes = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return bytes;
  }


}
