import { Amplify } from 'aws-amplify';
import { environment } from './environments/environment';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: environment.cognito.userPoolId,
      userPoolClientId: environment.cognito.userPoolClientId,
      identityPoolId: environment.cognito.identityPoolId
    }
  }
});


bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));