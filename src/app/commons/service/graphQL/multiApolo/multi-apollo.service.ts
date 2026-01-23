import { Injectable } from '@angular/core';
import { ApolloClient, InMemoryCache, ApolloLink } from '@apollo/client/core';
import { HttpLink } from 'apollo-angular/http';
import { SERVICES_CONFIG } from 'src/app/commons/service/graphQL/config/services.config';

// Definir interfaces para los tipos necesarios
interface ApolloClientConfig {
  link: ApolloLink;
  cache: InMemoryCache;
  defaultOptions?: ApolloClient.DefaultOptions;
}


@Injectable({
  providedIn: 'root',
})
export class MultiApolloService {
  private readonly clients: Map<string, ApolloClient> = new Map();

  constructor(private readonly httpLink: HttpLink) {
    this.initializeClients();
  }

  private initializeClients() {
    Object.entries(SERVICES_CONFIG).forEach(([serviceName, config]) => {
      console.log(`Initializing Apollo client for ${serviceName} with URI: ${config.uri}`);

      // Crear el enlace HTTP usando HttpLink de apollo-angular
      const httpLink = this.httpLink.create({ uri: config.uri });

      // Crear un enlace personalizado para manejar headers
      const authLink = new ApolloLink((operation, forward) => {
        const serviceHeaders = this.getHeadersForService(serviceName);

        // Obtener headers del contexto actual
        const context = operation.getContext();

        // Usar spread operator para combinar headers
        operation.setContext(() => ({
          headers: {
            ...context.headers,
            ...serviceHeaders,
          },
        }));

        return forward(operation);
      });

      // Usar ApolloLink.from
      const link = ApolloLink.from([authLink, httpLink]);

      // Crear configuración del cliente Apollo
      const clientConfig: ApolloClientConfig = {
        link: link,
        cache: new InMemoryCache(this.getCacheConfigForService(serviceName)),
        defaultOptions: this.getDefaultOptionsForService(serviceName),
      };

      // Crear el cliente Apollo
      const client = new ApolloClient(clientConfig);
      this.clients.set(serviceName, client);
    });
  }

  getClient(serviceName: string): ApolloClient {
    const client = this.clients.get(serviceName);
    if (!client) {
      throw new Error(`Apollo client for service '${serviceName}' not found`);
    }
    return client;
  }

  private getHeadersForService(serviceName: string): Record<string, string> {
    const commonHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const serviceHeaders: Record<string, Record<string, string>> = {
      patient_st: { 'X-Patient-Service': 'v1' },
      patient_ct: { 'X-Patient-Service': 'v1' },
    };

    return {
      ...commonHeaders,
      ...(serviceHeaders[serviceName] || {}),
    };
  }

  private getCacheConfigForService(serviceName: string) {
    const commonConfig = {
      addTypename: true,
    };

    const serviceHeaders: Record<string, any> = {
      patient_st: {
        ...commonConfig,
        typePolicies: {
          Patient: {
            keyFields: ['id'],
            fields: {
              photo: {
                merge: false,
              },
            },
          },
        },
      },
      patient_ct: {
        ...commonConfig,
        typePolicies: {},
      },
    };

    return serviceHeaders[serviceName] || commonConfig;
  }

  private getDefaultOptionsForService(serviceName: string) {
    const defaultOptions: ApolloClient.DefaultOptions = {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
        errorPolicy: 'ignore',
      },
      query: {
        fetchPolicy: 'network-only',
        errorPolicy: 'all',
      },
      mutate: {
        errorPolicy: 'all',
      },
    };
    return defaultOptions;
  }

  // Método para limpiar el cache de un cliente específico
  clearCache(serviceName: string): Promise<void> {
    const client = this.clients.get(serviceName);
    if (client) {
      return client.cache.reset();
    }
    return Promise.resolve();
  }

  // Método para obtener todos los clientes (útil para debugging)
  getAllClients(): Map<string, ApolloClient> {
    return new Map(this.clients);
  }
}
