import { Routes } from '@angular/router';
import { LandingPage } from './start/component/landing-page/landing-page';
import { loginGuard } from './login/guard/login-guard';

export const routes: Routes = [
  { path: '', component: LandingPage },

  {
    path: 'login',
    loadComponent: () =>
      import('./login/component/login-process/login-process').then((c) => c.LoginProcess),
  },

  {
    path: 'change-password',
    loadComponent: () =>
      import('./login/component/change-password/change-password').then(
        (c) => c.ChangePassword,
      ),
  },

  {
    path: 'recover-password',
    loadComponent: () =>
      import('./login/component/recover-password/recover-password').then(
        (c) => c.RecoverPassword,
      ),
  },

  {
    path: 'home-patient',
    loadComponent: () =>
      import('./home/component/patient-home/patient-home').then(
        (c) => c.PatientHome,
      ),
    canActivate: [loginGuard],
  },

  { path: '**', redirectTo: '' },
];
