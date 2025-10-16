import { environment } from "../../../environments/environment";
import * as CryptoJS from 'crypto-js';

export class Encrypt {
    private static readonly secretKey = environment.secretKey;

    public static encryptParam(value: string, param:boolean): string { 
        const encrypted = CryptoJS.AES.encrypt(value, this.secretKey).toString();
        return param ? encodeURIComponent(encrypted): encrypted;
    }

    public static decryptParam(encryptedValue: string): string {
        const bytes = CryptoJS.AES.decrypt(encryptedValue, this.secretKey);
        return bytes.toString(CryptoJS.enc.Utf8);
    }
}
