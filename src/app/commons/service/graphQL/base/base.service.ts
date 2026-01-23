import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  ApolloClient,
  DocumentNode,
  TypedDocumentNode,
  OperationVariables
} from '@apollo/client/core';
import { MultiApolloService } from '../multiApolo/multi-apollo.service';
import { GlobalError, GlobalErrorType } from '../error/error-types';

@Injectable()
export abstract class BaseService {
  protected client: ApolloClient;

  constructor(
    protected multiApollo: MultiApolloService,
    protected serviceName: string
  ) {
    this.client = this.multiApollo.getClient(serviceName);
  }

  protected query<T = any, V extends OperationVariables = OperationVariables>(
    query: DocumentNode | TypedDocumentNode<T, V>,
    variables?: V
  ): Observable<T> {
    return new Observable<T>(observer => {
      this.client.query<T, V>({
        query,
        variables: variables ?? ({} as V),  // Cambiado a nullish coalescing
      }).then((result: any) => {
        if (result.errors && result.errors.length > 0) {
          console.error('GraphQL errors:', result.errors);
          const mappedError = this.mapGraphQLError(result.errors[0]);
          observer.error(mappedError);
          return;
        }

        if (result.data === undefined || result.data === null) {
          const error = new GlobalError(
            GlobalErrorType.UNKNOWN_ERROR,
            'No data received from query',
            'NO_DATA_RECEIVED'
          );
          observer.error(error);
          return;
        }

        observer.next(result.data);
        observer.complete();
      }).catch((error: unknown) => {
        console.error('Query error:', error);
        observer.error(this.normalizeError(error));
      });
    }).pipe(
      catchError((error: unknown) => this.handleError(error, 'query'))
    );
  }

  protected mutate<T = any, V extends OperationVariables = OperationVariables>(
    mutation: DocumentNode | TypedDocumentNode<T, V>,
    variables?: V
  ): Observable<T> {
    return new Observable<T>(observer => {
      this.client.mutate<T, V>({
        mutation,
        variables: variables ?? ({} as V)  // Cambiado a nullish coalescing
      }).then((result: any) => {
        if (result.errors && result.errors.length > 0) {
          console.error('GraphQL errors:', result.errors);
          const mappedError = this.mapGraphQLError(result.errors[0]);
          observer.error(mappedError);
          return;
        }

        if (result.data === undefined || result.data === null) {
          const error = new GlobalError(
            GlobalErrorType.UNKNOWN_ERROR,
            'No data received from mutation',
            'NO_DATA_RECEIVED'
          );
          observer.error(error);
          return;
        }

        observer.next(result.data);
        observer.complete();
      }).catch((error: unknown) => {
        console.error('Mutation error:', error);
        observer.error(this.normalizeError(error));
      });
    }).pipe(
      catchError((error: unknown) => this.handleError(error, 'mutation'))
    );
  }

  private handleError(error: unknown, operationType: string): Observable<never> {
    console.error(`Error en ${this.serviceName} - ${operationType}:`, error);

    const normalizedError = this.normalizeError(error);
    return throwError(() => normalizedError);
  }

  private normalizeError(error: unknown): GlobalError {
    // Si ya es un GlobalError, lo retornamos directamente
    if (error instanceof GlobalError) {
      return error;
    }

    // Manejamos errores Apollo
    if (this.isApolloError(error)) {
      const apolloError = error as any;

      if (apolloError.networkError) {
        return this.mapNetworkError(apolloError.networkError);
      }

      if (apolloError.graphQLErrors && apolloError.graphQLErrors.length > 0) {
        return this.mapGraphQLError(apolloError.graphQLErrors[0]);
      }

      return new GlobalError(
        GlobalErrorType.UNKNOWN_ERROR,
        apolloError.message || 'Error Apollo desconocido',
        'APOLLO_ERROR'
      );
    }

    // Manejamos errores de red
    if (this.isNetworkError(error)) {
      return this.mapNetworkError(error);
    }

    // Manejamos errores GraphQL directos
    if (this.isGraphQLError(error)) {
      return this.mapGraphQLError(error);
    }

    // Error genérico
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return new GlobalError(
      GlobalErrorType.UNKNOWN_ERROR,
      String(message),
      'UNKNOWN_ERROR'
    );
  }

  public mapGraphQLError(graphQLError: any): GlobalError {
    const message = graphQLError.message || 'Error GraphQL desconocido';
    const code = graphQLError.extensions?.code;
    const classification = graphQLError.extensions?.classification;

    switch (code) {
      case 'UNAUTHENTICATED':
      case 'JWT_EXPIRED':
      case 'INVALID_TOKEN':
        return new GlobalError(
          GlobalErrorType.AUTHENTICATION_ERROR,
          message,
          code,
          classification
        );

      case 'FORBIDDEN':
      case 'INSUFFICIENT_PERMISSIONS':
        return new GlobalError(
          GlobalErrorType.AUTHORIZATION_ERROR,
          message,
          code
        );

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
    const statusCode = networkError.statusCode || networkError.status;
    const message = networkError.message || 'Error de red';

    if (statusCode) {
      switch (statusCode) {
        case 401:
          return new GlobalError(
            GlobalErrorType.AUTHENTICATION_ERROR,
            'Sesión expirada',
            'NETWORK_401',
            'UNAUTHORIZED'
          );
        case 403:
          return new GlobalError(
            GlobalErrorType.AUTHORIZATION_ERROR,
            'Acceso denegado',
            'NETWORK_403',
            'FORBIDDEN'
          );
        case 429:
          return new GlobalError(
            GlobalErrorType.RATE_LIMIT_ERROR,
            'Demasiadas solicitudes',
            'NETWORK_429',
            'TOO_MANY_REQUESTS'
          );
        case 500:
        case 502:
        case 503:
          return new GlobalError(
            GlobalErrorType.SERVER_ERROR,
            'Error interno del servidor',
            `NETWORK_${statusCode}`,
            String(statusCode)
          );
        default:
          return new GlobalError(
            GlobalErrorType.NETWORK_ERROR,
            message,
            'NETWORK_ERROR',
            String(statusCode)
          );
      }
    }

    // Para errores de conexión sin código de estado
    if (message.includes('Failed to fetch') || message.includes('Network request failed')) {
      return new GlobalError(
        GlobalErrorType.NETWORK_ERROR,
        'Error de conexión. Verifique su conexión a internet.',
        'CONNECTION_ERROR'
      );
    }

    return new GlobalError(
      GlobalErrorType.NETWORK_ERROR,
      'Error de conexión',
      'CONNECTION_ERROR'
    );
  }

  // Type guards
  private isApolloError(error: any): boolean {
    return error?.graphQLErrors !== undefined || error?.networkError !== undefined;
  }

  private isNetworkError(error: any): boolean {
    return error?.statusCode !== undefined ||
           error?.status !== undefined ||
           error?.name === 'NetworkError' ||
           error.message?.includes?.('Network') ||
           error.message?.includes?.('fetch');
  }

  private isGraphQLError(error: any): boolean {
    // Usando optional chaining en lugar de verificación manual
    return error?.message !== undefined &&
           (error?.extensions !== undefined || error?.path !== undefined);
  }
}