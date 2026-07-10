import { HttpHeaders, HttpParams } from "@angular/common/http";

export interface HttpOptions {
    headers?: HttpHeaders;
    params?: HttpParams;
    withCredentials?: boolean;
}
