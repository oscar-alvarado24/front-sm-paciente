import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  ApolloClient,
  OperationVariables,
  TypedDocumentNode,
  CombinedGraphQLErrors
} from '@apollo/client';
import { GraphQLError } from 'graphql';
import { MultiApolloService } from '../multi-apolo/multi-apolo';
import { GlobalError, GlobalErrorType } from '../error/error-type';

@Injectable()
export abstract class BaseGraphqlService {
  protected readonly multiApollo = inject(MultiApolloService);
  protected abstract readonly serviceName: string;

  protected client!: ApolloClient;

  protected initClient(): void {
    this.client = this.multiApollo.getClient(this.serviceName);
  }

  protected query<T, V extends OperationVariables = OperationVariables>(
    query: TypedDocumentNode<T, V>,
    variables?: V
  ): Observable<T> {
    return new Observable<T>(observer => {
      const options = { query, variables: variables ?? ({} as V) };

      this.client.query(options).then(result => {
        observer.next(result.data as T);
        console.log('Query result:', result.data);
        observer.complete();
      }).catch((error: unknown) => {
        observer.error(error);
      });
    }).pipe(
      catchError(error => this.handleError(error, 'query'))
    );
  }

  protected mutate<T, V extends OperationVariables = OperationVariables>(
    mutation: TypedDocumentNode<T, V>,
    variables?: V
  ): Observable<T> {
    return new Observable<T>(observer => {
      const options = { mutation, variables: variables ?? ({} as V) };

      this.client.mutate(options).then(result => {
        observer.next(result.data as T);
        observer.complete();
      }).catch((error: unknown) => {
        observer.error(error);
      });
    }).pipe(
      map(result => (result as T & { data: T }).data ?? result),
      catchError(error => this.handleError(error, 'mutation'))
    );
  }

  private handleError(error: unknown, operationType: string): Observable<never> {
    console.error(`Error en ${this.serviceName} - ${operationType}:`, error);

    if (error instanceof GlobalError) {
      return throwError(() => error);
    }

    // Apollo 4: CombinedGraphQLErrors reemplaza a ApolloError para errores GraphQL
    if (CombinedGraphQLErrors.is(error)) {
      return throwError(() => this.mapGraphQLError(error.errors[0] as GraphQLError));
    }

    // Apollo 4: errores de red son instancias de Error directamente
    if (error instanceof Error && 'statusCode' in error) {
      return throwError(() => this.mapNetworkError(error as Error & { statusCode: number }));
    }

    const message = error instanceof Error ? error.message : 'Error desconocido';
    return throwError(() => new GlobalError(
      GlobalErrorType.UNKNOWN_ERROR,
      message,
      'UNKNOWN',
      undefined
    ));
  }

  public mapGraphQLError(graphQLError: GraphQLError): GlobalError {
    const message = graphQLError.message;
    const code = graphQLError.extensions?.['code'] as string | undefined;
    const classification = graphQLError.extensions?.['classification'] as string | undefined;

    switch (code) {
      case 'UNAUTHENTICATED':
      case 'JWT_EXPIRED':
      case 'INVALID_TOKEN':
        return new GlobalError(GlobalErrorType.AUTHENTICATION_ERROR, message, code, classification);

      case 'FORBIDDEN':
      case 'INSUFFICIENT_PERMISSIONS':
        return new GlobalError(GlobalErrorType.AUTHORIZATION_ERROR, message, code);

      case 'VALIDATION_FAILED':
      case 'INVALID_INPUT':
      case 'PATIENT_NOT_FOUND':
      case 'INVALID_IMAGE_FORMAT':
      case 'FILE_SIZE_EXCEEDED':
        return new GlobalError(GlobalErrorType.VALIDATION_ERROR, message, code);

      case 'INTERNAL_SERVER_ERROR':
      case 'STORAGE_SERVICE_ERROR':
        return new GlobalError(GlobalErrorType.SERVER_ERROR, message, code);

      case 'RATE_LIMITED':
        return new GlobalError(GlobalErrorType.RATE_LIMIT_ERROR, message, code);

      case 'MAINTENANCE_MODE':
        return new GlobalError(GlobalErrorType.MAINTENANCE_MODE, message, code);

      default:
        return new GlobalError(
          GlobalErrorType.UNKNOWN_ERROR,
          message,
          code ?? 'UNKNOWN_GRAPHQL_ERROR'
        );
    }
  }

  private mapNetworkError(networkError: Error & { statusCode?: number }): GlobalError {
    switch (networkError.statusCode) {
      case 401:
        return new GlobalError(GlobalErrorType.AUTHENTICATION_ERROR, 'Sesión expirada', 'NETWORK_401', 'UNAUTHORIZED');
      case 403:
        return new GlobalError(GlobalErrorType.AUTHORIZATION_ERROR, 'Acceso denegado', 'NETWORK_403', 'FORBIDDEN');
      case 429:
        return new GlobalError(GlobalErrorType.RATE_LIMIT_ERROR, 'Demasiadas solicitudes', 'NETWORK_429', 'TOO_MANY_REQUESTS');
      case 500:
      case 502:
      case 503:
        return new GlobalError(GlobalErrorType.SERVER_ERROR, 'Error interno del servidor', `NETWORK_${networkError.statusCode}`);
      default:
        return new GlobalError(
          GlobalErrorType.NETWORK_ERROR,
          networkError.message ?? 'Error de red',
          'NETWORK_ERROR'
        );
    }
  }
}