import { Injectable } from '@angular/core';
import { ApolloClient, InMemoryCache, FetchPolicy } from '@apollo/client/core';
import { HttpLink } from 'apollo-angular/http';
import { HttpHeaders } from '@angular/common/http';
import { SERVICES_CONFIG } from 'src/config/services.config';
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
      this.clients[serviceName] = new ApolloClient({
        link: this.httpLink.create({ 
          uri: config.uri,
          headers: this.getHeadersForService(serviceName)
        }),
        cache: new InMemoryCache(this.getCacheConfigForService(serviceName)),
        defaultOptions: this.getDefaultOptionsForService(serviceName)
      });
    });
  }

  // Obtener cliente específico para un servicio
  getClient(serviceName: string): ApolloClient<any> {
    const client = this.clients[serviceName];
    if (!client) {
      throw new Error(`Apollo client for service '${serviceName}' not found`);
    }
    return client;
  }

  // Headers específicos por servicio - Ahora retorna HttpHeaders
  private getHeadersForService(serviceName: string): HttpHeaders {
    const commonHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getAuthToken()}`
    };

    const serviceHeaders: Record<string, Record<string, string>> = {
      patient: { 'X-Patient-Service': 'v1' },
      users: { 'X-User-Service': 'v1' },
      orders: { 'X-Order-Service': 'v1' },
      products: { 'X-Product-Service': 'v1' }
    };

    const headers = {
      ...commonHeaders,
      ...(serviceHeaders[serviceName] || {})
    };

    return new HttpHeaders(headers);
  }

  // Configuración de cache específica por servicio
  private getCacheConfigForService(serviceName: string) {
    const commonConfig = {
      addTypename: true,
    };

    const serviceConfigs: Record<string, any> = {
      patient_st: {
        ...commonConfig,
        typePolicies: {
          Patient: {
            keyFields: ['id'],
            fields: {
              photo: { merge: false }, // No cachear fotos
            }
          }
        }
      },
      patient_ct: {
        ...commonConfig,
        typePolicies: {
        }
      }
    };

    return serviceConfigs[serviceName] || commonConfig;
  }

  // Opciones por defecto específicas por servicio
  private getDefaultOptionsForService(serviceName: string) {
    return {
      watchQuery: {
        errorPolicy: 'none' as const,
        fetchPolicy: serviceName === 'patient_st' ? 'cache-first': 'cache-and-network' as FetchPolicy
      },
      query: {
        errorPolicy: 'none' as const,
        fetchPolicy: serviceName === 'patient_st' ? 'cache-first' : 'cache-and-network' as FetchPolicy
      },
      mutate: {
        errorPolicy: 'none' as const,
      }
    };
  }

  private getAuthToken(): string {
    return localStorage.getItem('authToken') || '';
  }
}