import { Injectable } from '@angular/core';
import { ApolloClient, InMemoryCache, FetchPolicy, ApolloLink } from '@apollo/client/core';
import { HttpLink } from 'apollo-angular/http';
import { setContext } from '@apollo/client/link/context';
import { SERVICES_CONFIG } from 'src/app/commons/service/graphQL/config/services.config';

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
      console.log(`Initializing Apollo client for ${serviceName} with URI: ${config.uri}`);

      // Crear el HTTP link básico
      const http = this.httpLink.create({
        uri: config.uri
      });

      // Crear el auth link con headers
      const authLink = setContext((_, { headers }) => {
        const serviceHeaders = this.getHeadersForService(serviceName);
        return {
          headers: {
            ...headers,
            ...serviceHeaders
          }
        };
      });

      // Combinar los links
      const link = ApolloLink.from([authLink, http]);

      this.clients[serviceName] = new ApolloClient({
        link: link,
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

  // Headers específicos por servicio - Retorna objeto plano
  private getHeadersForService(serviceName: string): Record<string, string> {
    const commonHeaders: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    const token = this.getAuthToken();
    if (token) {
      commonHeaders['Authorization'] = `Bearer ${token}`;
    }

    const serviceHeaders: Record<string, Record<string, string>> = {
      patient_st: { 'X-Patient-Service': 'v1' },
      patient_ct: { 'X-Patient-Service': 'v1' },
      users: { 'X-User-Service': 'v1' },
      orders: { 'X-Order-Service': 'v1' },
      products: { 'X-Product-Service': 'v1' }
    };

    return {
      ...commonHeaders,
      ...(serviceHeaders[serviceName] || {})
    };
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