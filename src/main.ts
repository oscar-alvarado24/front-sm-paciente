import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { Amplify } from 'aws-amplify';
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito';
import { CookieStorage } from 'aws-amplify/utils';
import { environment } from './environments/environment';

Amplify.configure({
  Auth: {
    Cognito: {
      identityPoolId: environment.cognito.identityPoolId,
      userPoolId: environment.cognito.userPoolId,
      userPoolClientId: environment.cognito.userPoolClientId,
    }
  }
});

cognitoUserPoolsTokenProvider.setKeyValueStorage(new CookieStorage({
  domain: environment.cookieDomain,
  secure: environment.production,
  sameSite: 'lax',
  expires: 365
}));

try {
  await bootstrapApplication(App, appConfig);
} catch (err) {
  console.error(err);
}
