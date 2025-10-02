import { APOLLO_OPTIONS, ApolloModule } from 'apollo-angular';
import { NgModule } from '@angular/core';
import { MultiApolloService } from '../../service/graphQL/multiApolo/multi-apollo.service';
// Importa la configuración de servicios GraphQL
import { SERVICES_CONFIG } from 'src/app/commons/service/graphQL/config/services.config';
@NgModule({
  imports: [ApolloModule],
  providers: [
    MultiApolloService,
    {
      provide: APOLLO_OPTIONS,
      useFactory: (multiApollo: MultiApolloService) => {
        // Usa el primer servicio disponible como cliente principal por defecto
        const defaultService = Object.keys(SERVICES_CONFIG)[0]; // 'patient_ct'
        return multiApollo.getClient(defaultService);
      },
      deps: [MultiApolloService],
    },
  ],
  exports: [ApolloModule]
})
export class GraphQLModule {}