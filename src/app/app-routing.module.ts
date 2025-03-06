import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './general/components/home/home.component';
import { LoginComponent } from './login-process/components/login/login.component';
import { ChangePasswordComponent } from './login-process/components/change-password/change-password.component';
import { GenerateCodeComponent } from './components/generate-code/generate-code.component';
import { CodeComponent } from './components/code/code.component';
import { OptionsMenuComponent } from './components/options-menu/options-menu.component';
import { PersonalMenuComponent } from './components/personal-menu/personal-menu.component';
import { PatientHomeComponent } from './components/patient-home/patient-home.component';
import { RecoverPasswordComponent } from './login-process/components/recover-password/recover-password.component';
import { roleGuard } from './login-process/guards/login.guard';
const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'change-password', component: ChangePasswordComponent},
  { path: 'generate-code', component: GenerateCodeComponent},
  { path: 'option-menu', component: OptionsMenuComponent},
  { path: 'personal-menu', component: PersonalMenuComponent},
  { 
    path: 'home-patient', 
    component: PatientHomeComponent,
    canActivate: [roleGuard]
  },
  { path: 'code', component: CodeComponent},
  { path: 'recover-password', component: RecoverPasswordComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
