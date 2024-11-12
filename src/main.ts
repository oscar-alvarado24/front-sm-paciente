import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Amplify } from '@aws-amplify/core';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';


Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: environment.cognito.userPoolId,
      userPoolClientId: environment.cognito.userPoolClientId,
    }
  }
});

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
