import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Aquí puedes agregar lógica para añadir tokens de autenticación
    // Por ejemplo:
    
    // Obtener token del localStorage o de un servicio
    const token = localStorage.getItem('authToken');
    
    if (token) {
      // Clonar la request y agregar el header de autorización
      const authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      return next.handle(authReq);
    }
    
    // Si no hay token, continuar con la request original
    return next.handle(req);
  }
}