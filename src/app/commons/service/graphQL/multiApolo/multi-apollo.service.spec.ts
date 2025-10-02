import { Injectable } from '@angular/core';
import { HttpLink } from 'apollo-angular/http';
import { ApolloClient, InMemoryCache, DefaultOptions, FetchPolicy } from '@apollo/client/core';
import { SERVICES_CONFIG } from 'src/app/commons/service/graphQL/config/services.config';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class MultiApolloService {
  private clients: Record<string, ApolloClient<any>> = {};

  constructor(private readonly httpLink: HttpLink) {
    this.initializeClients();
  }

  private initializeClients() {
    Object.entries(SERVICES_CONFIG).forEach(([serviceName, config]) => {
      // Only initialize clients for allowed service names
      if (serviceName === 'patient_ct' || serviceName === 'patient_st') {
        this.clients[serviceName] = new ApolloClient({
          link: this.httpLink.create({
            uri: config.uri,
            headers: this.getHeadersForService(serviceName)
          }),
          cache: new InMemoryCache(this.getCacheConfigForService(serviceName)),
          defaultOptions: this.getDefaultOptionsForService(serviceName)
        });
      }
    });
  }

  // Obtener cliente específico para un servicio
  /**
   * Retrieves the Apollo client instance associated with the specified service name.
   *
   * @param serviceName - The name of the service for which to obtain the Apollo client.
   * @returns The ApolloClient instance corresponding to the given service name.
   * @throws {Error} If no Apollo client is found for the specified service name.
   */
  getClient(serviceName: string): ApolloClient<any> {
    const client = this.clients[serviceName];
    if (!client) {
      throw new Error(`Apollo client for service '${serviceName}' not found`);
    }
    return client;
  }
  // Headers específicos por servicio
  private getHeadersForService(serviceName: string): HttpHeaders {
    const commonHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getAccessToken()}`
    };

    const serviceHeaders: Record<string, { [key: string]: string }> = {
      patient_ct: { 'X-Patient-With-Token-Service': 'v1' },
      patient_st: { 'X-User-Without-Token-Service': 'v1' }
    };

    return new HttpHeaders({
      ...commonHeaders,
      ...(serviceHeaders[serviceName] || {})
    });
  }


  // Configuración de cache específica por servicio
  private getCacheConfigForService(
    serviceName: 'patient_ct' | 'patient_st'
  ): Record<string, any> {
    const commonConfig = {
      addTypename: true,
    };

    const serviceConfigs: Record<'patient_ct' | 'patient_st', Record<string, any>> = {
      patient_ct: {
        ...commonConfig,
        typePolicies: {
          patient_ct: {
            keyFields: ['id'],
          }
        }
      },
      patient_st: {
        ...commonConfig,
        typePolicies: {
          patient_st: {
            keyFields: ['id'],
            fields: {
              photo: { merge: false }, // No cachear fotos 
              status: { merge: false } // No cachear estado
            }
          }
        }
      }
    };

    return serviceConfigs[serviceName] || commonConfig;
  }

  // Opciones por defecto específicas por servicio
  private getDefaultOptionsForService(serviceName: string): DefaultOptions {
    return {
      watchQuery: {
        errorPolicy: 'none',
        fetchPolicy: 'cache-and-network'
      },
      query: {
        errorPolicy: 'none',
        fetchPolicy: serviceName === 'patient_ct' ? 'cache-first' : 'cache-and-network' as FetchPolicy
      },
      mutate: {
        errorPolicy: 'none',
      }
    };
  }

  getAccessToken(): string | null {
    const prefix = 'CognitoIdentityServiceProvider.';
    const suffix = '.accessToken';

    // Obtener todas las claves del localStorage
    const keys = Object.keys(localStorage);

    // Buscar la clave que coincida con el patrón
    const targetKey = keys.find(key =>
      key.startsWith(prefix) && key.endsWith(suffix)
    );

    return targetKey ? localStorage.getItem(targetKey) : "";
  }
}