import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApolloClient } from '@apollo/client/core';
import { MultiApolloService } from '../multiApolo/multi-apollo.service';
import { GlobalError, GlobalErrorType } from '../error/error-types'; 

@Injectable()
export abstract class BaseService {
  protected client: ApolloClient<any>;

  constructor(
    protected multiApollo: MultiApolloService,
    protected serviceName: string
  ) {
    this.client = this.multiApollo.getClient(serviceName);
  }

  protected query<T>(query: any, variables: any = {}): Observable<T> {
  return new Observable<T>(observer => { // Especificar tipo genérico aquí
    this.client.query<T>({
      query,
      variables,
    }).then(result => {
      if (result.errors && result.errors.length > 0) {
        console.error('GraphQL errors:', result.errors);
        const mappedError = this.mapGraphQLError(result.errors[0]);
        observer.error(mappedError);
        return;
      }
      // Emitir la respuesta completa de data
      observer.next(result.data); // Forzar tipo T
      console.log("Query result:", result.data);
      observer.complete();
    }).catch(error => {
      observer.error(error);
    });
  }).pipe(
    // Mantener catchError sin el map problemático
    catchError(error => this.handleError(error, 'query'))
  );
}
  protected mutate<T>(mutation: any, variables: any = {}): Observable<T> {
    return new Observable(observer => {
      this.client.mutate<T>({
        mutation,
        variables
      }).then(result => {
        if (result.errors && result.errors.length > 0) {
          const mappedError = this.mapGraphQLError(result.errors[0]);
          observer.error(mappedError);
          return;
        }
        observer.next(result.data ?? undefined);
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    }).pipe(
      map(result => (result as T & { data: any }).data),
      catchError(error => this.handleError(error, 'mutation'))
    );
  }
 
  
  private handleError(error: any, operationType: string): Observable<never> {
    console.error(`Error en ${this.serviceName} - ${operationType}:`, error);

    let mappedError: GlobalError;

    // Si ya es nuestro error personalizado
    if (error instanceof GlobalError) {
      mappedError = error;
    }
    // Error de red
    else if (error.networkError) {
      mappedError = this.mapNetworkError(error.networkError);
    }
    // Errores GraphQL
    else if (error.graphQLErrors && error.graphQLErrors.length > 0) {
      mappedError = this.mapGraphQLError(error.graphQLErrors[0]);
    }
    // Error genérico
    else {
      mappedError = new GlobalError(
        GlobalErrorType.UNKNOWN_ERROR,
        error.message || 'Error desconocido',
        'UNKNOWN',
        undefined
      );
    }

    return throwError(() => mappedError);
  }

  public mapGraphQLError(graphQLError: any): GlobalError {
    const message = graphQLError.message;
    const code = graphQLError.extensions?.code;
    const classification = graphQLError.extensions?.classification;

    switch (code) {
      // Errores de autenticación
      case 'UNAUTHENTICATED':
      case 'JWT_EXPIRED':
      case 'INVALID_TOKEN':
        return new GlobalError(
          GlobalErrorType.AUTHENTICATION_ERROR, 
          message, 
          code,
          classification
        );

      // Errores de autorización  
      case 'FORBIDDEN':
      case 'INSUFFICIENT_PERMISSIONS':
        return new GlobalError(
          GlobalErrorType.AUTHORIZATION_ERROR, 
          message, 
          code
        );

      // Errores de validación
      case 'VALIDATION_FAILED':
      case 'INVALID_INPUT':
      case 'PATIENT_NOT_FOUND':
      case 'INVALID_IMAGE_FORMAT':
      case 'FILE_SIZE_EXCEEDED':
        return new GlobalError(
          GlobalErrorType.VALIDATION_ERROR, 
          message, 
          code
        );

      // Errores del sistema
      case 'INTERNAL_SERVER_ERROR':
      case 'STORAGE_SERVICE_ERROR':
        return new GlobalError(
          GlobalErrorType.SERVER_ERROR, 
          message, 
          code
        );

      case 'RATE_LIMITED':
        return new GlobalError(
          GlobalErrorType.RATE_LIMIT_ERROR, 
          message, 
          code
        );

      case 'MAINTENANCE_MODE':
        return new GlobalError(
          GlobalErrorType.MAINTENANCE_MODE, 
          message, 
          code
        );

      default:
        return new GlobalError(
          GlobalErrorType.UNKNOWN_ERROR, 
          message, 
          code || 'UNKNOWN_GRAPHQL_ERROR'
        );
    }
  }

  private mapNetworkError(networkError: any): GlobalError {
    if (networkError.statusCode) {
      switch (networkError.statusCode) {
        case 401:
          return new GlobalError(
            GlobalErrorType.AUTHENTICATION_ERROR, 
            'Sesión expirada', 
            'NETWORK_401',
            "UNAUTHORIZED"
          );
        case 403:
          return new GlobalError(
            GlobalErrorType.AUTHORIZATION_ERROR, 
            'Acceso denegado', 
            'NETWORK_403',
            "FORBIDDEN"
          );
        case 429:
          return new GlobalError(
            GlobalErrorType.RATE_LIMIT_ERROR, 
            'Demasiadas solicitudes', 
            'NETWORK_429',
            "TOO_MANY_REQUESTS"
          );
        case 500:
        case 502:
        case 503:
          return new GlobalError(
            GlobalErrorType.SERVER_ERROR, 
            'Error interno del servidor', 
            `NETWORK_${networkError.statusCode}`,
            networkError.statusCode.name
          );
        default:
          return new GlobalError(
            GlobalErrorType.NETWORK_ERROR, 
            networkError.message, 
            'NETWORK_ERROR',
            networkError.statusCode.name
          );
      }
    }
    
    return new GlobalError(
      GlobalErrorType.NETWORK_ERROR, 
      'Error de conexión', 
      'CONNECTION_ERROR'
    );
  }
}