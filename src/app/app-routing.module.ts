import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './general/components/home/home.component';
import { roleGuard } from './login-process/guards/login.guard';

const routes: Routes = [
  { path: '', component: HomeComponent },
  
  // Lazy loading con componentes standalone
  { 
    path: 'login', 
    loadComponent: () => import('./login-process/components/login/login.component').then(c => c.LoginComponent)
  },
  
  { 
    path: 'change-password', 
    loadComponent: () => import('./login-process/components/change-password/change-password.component').then(c => c.ChangePasswordComponent)
  },
  
  { 
    path: 'recover-password', 
    loadComponent: () => import('./login-process/components/recover-password/recover-password.component').then(c => c.RecoverPasswordComponent)
  },
  
  { 
    path: 'generate-code', 
    loadComponent: () => import('./components/generate-code/generate-code.component').then(c => c.GenerateCodeComponent)
  },
  
  { 
    path: 'code', 
    loadComponent: () => import('./components/code/code.component').then(c => c.CodeComponent)
  },
  
  { 
    path: 'option-menu', 
    loadComponent: () => import('./commons/components/options-menu/options-menu.component').then(c => c.OptionsMenuComponent)
  },
  
  { 
    path: 'home-patient', 
    loadComponent: () => import('./patient-home/components/patient-home/patient-home.component').then(c => c.PatientHomeComponent),
    canActivate: [roleGuard]
  },
  
  // Redirección por defecto
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }