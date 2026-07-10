import { Injectable, inject } from '@angular/core';
import { ApolloClient, InMemoryCache, FetchPolicy, ApolloLink } from '@apollo/client/core';
import { HttpLink } from 'apollo-angular/http';
import { SetContextLink } from '@apollo/client/link/context';
import { SERVICES_CONFIG } from '../config/config';
import { AuthService } from '../../auth/auth';

@Injectable({
  providedIn: 'root',
})
export class MultiApolloService {
  private readonly httpLink = inject(HttpLink);
  private readonly authService = inject(AuthService);

  private readonly clients: Record<string, ApolloClient> = {};

  constructor() {
    this.initializeClients();
  }

  private initializeClients(): void {
    Object.entries(SERVICES_CONFIG).forEach(([serviceName, config]) => {
      console.log(`Initializing Apollo client for ${serviceName} with URI: ${config.uri}`);

      const http = this.httpLink.create({ uri: config.uri });

      const authLink = new SetContextLink(async (prevContext) => {
        const token = await this.authService.getAccessToken();

        return {
          headers: {
            ...prevContext['headers'],
            ...this.getHeadersForService(serviceName),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        };
      });

      const link = ApolloLink.from([authLink, http]);

      this.clients[serviceName] = new ApolloClient({
        link,
        cache: new InMemoryCache(this.getCacheConfigForService(serviceName)),
        defaultOptions: this.getDefaultOptionsForService(serviceName),
      });
    });
  }

  getClient(serviceName: string): ApolloClient {
    const client = this.clients[serviceName];
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
      patient_wt: { 'X-Patient-Service': 'v1' }
    };

    return {
      ...commonHeaders,
      ...serviceHeaders[serviceName],
    };
  }

  private getCacheConfigForService(serviceName: string): object {
    const commonConfig = {
      addTypename: true,
    };

    const serviceConfigs: Record<string, object> = {
      patient_wt: {
        ...commonConfig,
        typePolicies: {
          Patient: {
            keyFields: ['id'],
            fields: {
              photo: { merge: false },
            },
          },
        },
      },
    };

    return serviceConfigs[serviceName] ?? commonConfig;
  }

  private getDefaultOptionsForService(serviceName: string): ApolloClient.DefaultOptions {
    const watchQueryPolicy = (
      serviceName === 'patient_wt' ? 'cache-first' : 'cache-and-network'
    ) as FetchPolicy;

    // client.query() no soporta cache-and-network, usar network-only como alternativa
    const queryPolicy = (
      serviceName === 'patient_wt' ? 'cache-first' : 'network-only'
    ) as FetchPolicy;

    return {
      watchQuery: {
        fetchPolicy: watchQueryPolicy, // cache-and-network sí funciona aquí
        errorPolicy: 'none',
      },
      query: {
        fetchPolicy: queryPolicy, // network-only en lugar de cache-and-network
        errorPolicy: 'none',
      },
      mutate: {
        errorPolicy: 'none',
      },
    } as ApolloClient.DefaultOptions;
  }
}
